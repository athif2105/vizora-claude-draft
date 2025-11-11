import {onCall, HttpsError} from "firebase-functions/v2/https";
import {setGlobalOptions} from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin
admin.initializeApp();

// Set global options
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

/**
 * List GA4 properties accessible to the authenticated user
 */
export const listGA4Properties = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;

  try {
    // Get user's GA access token from Firestore
    const tokenDoc = await admin
      .firestore()
      .collection("gaConnections")
      .doc(userId)
      .get();

    if (!tokenDoc.exists) {
      throw new HttpsError(
        "failed-precondition",
        "User has not connected Google Analytics"
      );
    }

    const tokenData = tokenDoc.data();
    const accessToken = tokenData?.accessToken;

    if (!accessToken) {
      throw new HttpsError(
        "failed-precondition",
        "Access token not found"
      );
    }

    // Use Google Analytics Admin API to list properties
    // Note: This requires the Google Analytics Admin API to be enabled
    const response = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new HttpsError(
        "internal",
        `Failed to fetch GA4 properties: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Extract properties from account summaries
    const properties: Array<{
      id: string;
      name: string;
      displayName: string;
    }> = [];

    if (data.accountSummaries) {
      data.accountSummaries.forEach((account: any) => {
        if (account.propertySummaries) {
          account.propertySummaries.forEach((property: any) => {
            properties.push({
              id: property.property.replace("properties/", ""),
              name: property.property,
              displayName: property.displayName,
            });
          });
        }
      });
    }

    logger.info(`Found ${properties.length} GA4 properties for user ${userId}`);

    return {
      success: true,
      properties,
    };
  } catch (error: any) {
    logger.error("Error listing GA4 properties:", error);
    throw new HttpsError(
      "internal",
      `Failed to list GA4 properties: ${error.message}`
    );
  }
});

/**
 * Fetch funnel data from GA4
 */
export const fetchGA4FunnelData = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;
  const {propertyId, startDate, endDate, funnelSteps} = request.data;

  // Validate input
  if (!propertyId || !startDate || !endDate || !funnelSteps) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required parameters"
    );
  }

  try {
    // Get user's GA access token from Firestore
    const tokenDoc = await admin
      .firestore()
      .collection("gaConnections")
      .doc(userId)
      .get();

    if (!tokenDoc.exists) {
      throw new HttpsError(
        "failed-precondition",
        "User has not connected Google Analytics"
      );
    }

    const tokenData = tokenDoc.data();
    const accessToken = tokenData?.accessToken;

    if (!accessToken) {
      throw new HttpsError(
        "failed-precondition",
        "Access token not found"
      );
    }

    // Build dimension filter for selected events only
    const eventNames = funnelSteps.map((s: any) => s.eventName).filter(Boolean);

    // Fetch data directly from GA4 Data API
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{startDate, endDate}],
          dimensions: [{name: "eventName"}],
          metrics: [{name: "eventCount"}],
          dimensionFilter: {
            filter: {
              fieldName: "eventName",
              inListFilter: {values: eventNames},
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GA4 API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform GA4 data to Vizora format
    const transformedData = transformGA4ToVizoraFormat(data);

    logger.info(`Fetched funnel data for property ${propertyId}`);

    return {
      success: true,
      data: transformedData,
    };
  } catch (error: any) {
    logger.error("Error fetching GA4 funnel data:", error);
    throw new HttpsError(
      "internal",
      `Failed to fetch funnel data: ${error.message}`
    );
  }
});

/**
 * Transform GA4 data to Vizora format
 */
function transformGA4ToVizoraFormat(ga4Response: any): any[] {
  const vizoraData: any[] = [];

  if (!ga4Response.rows) {
    return vizoraData;
  }

  let previousUsers = 0;
  ga4Response.rows.forEach((row: any, index: number) => {
    const stepName = row.dimensionValues?.[0]?.value || `Step ${index + 1}`;
    const activeUsers = parseInt(row.metricValues?.[0]?.value || "0");
    const completionRate = previousUsers > 0 ? (activeUsers / previousUsers) * 100 : 100;
    const abandonmentRate = 100 - completionRate;
    const abandonments = previousUsers > 0 ? previousUsers - activeUsers : 0;

    vizoraData.push({
      id: `step-${index + 1}`,
      name: stepName,
      value: activeUsers,
      activeUsers,
      completionRate,
      abandonmentRate,
      abandonments,
      elapsedTime: 0,
      order: index + 1,
    });

    previousUsers = activeUsers;
  });

  return vizoraData;
}

/**
 * Test GA4 connection
 */
export const testGA4Connection = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;

  try {
    const tokenDoc = await admin
      .firestore()
      .collection("gaConnections")
      .doc(userId)
      .get();

    if (!tokenDoc.exists) {
      return {
        success: false,
        connected: false,
        message: "Google Analytics not connected",
      };
    }

    const tokenData = tokenDoc.data();
    const accessToken = tokenData?.accessToken;

    if (!accessToken) {
      return {
        success: false,
        connected: false,
        message: "Access token not found",
      };
    }

    // Test the token by making a simple API call
    const response = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=1",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      logger.info(`GA4 connection test successful for user ${userId}`);
      return {
        success: true,
        connected: true,
        message: "Google Analytics connected successfully",
      };
    } else {
      return {
        success: false,
        connected: false,
        message: `Connection test failed: ${response.statusText}`,
      };
    }
  } catch (error: any) {
    logger.error("Error testing GA4 connection:", error);
    return {
      success: false,
      connected: false,
      message: `Connection test failed: ${error.message}`,
    };
  }
});
