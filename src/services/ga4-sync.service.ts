import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface GA4SyncedFunnel {
  id: string;
  userId: string;
  name: string;
  steps: GA4FunnelStep[];
  source: 'ga4_sync';
  syncedAt: Date;
  lastSyncedAt: Date;
  ga4Data?: any; // Original GA4 data
}

export interface GA4FunnelStep {
  name: string;
  activeUsers: number;
  completionRate: number;
  abandonmentRate: number;
  abandonments: number;
  elapsedTime: number;
  order: number;
}

interface GA4SyncedFunnelData {
  userId: string;
  name: string;
  steps: GA4FunnelStep[];
  source: 'ga4_sync';
  syncedAt: Timestamp;
  lastSyncedAt: Timestamp;
  ga4Data?: any;
}

/**
 * Save GA4 synced funnel to Firestore
 */
export const saveGA4SyncedFunnel = async (
  userId: string,
  funnelName: string,
  steps: GA4FunnelStep[],
  ga4Data?: any
): Promise<string> => {
  try {
    const funnelData: GA4SyncedFunnelData = {
      userId,
      name: funnelName,
      steps,
      source: 'ga4_sync',
      syncedAt: Timestamp.now(),
      lastSyncedAt: Timestamp.now(),
      ga4Data
    };

    const docRef = await addDoc(collection(db, 'ga4_synced_funnels'), funnelData);
    console.log('GA4 synced funnel saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving GA4 synced funnel:', error);
    throw new Error('Failed to save GA4 synced funnel');
  }
};

/**
 * Get all GA4 synced funnels for a user
 */
export const getGA4SyncedFunnels = async (userId: string): Promise<GA4SyncedFunnel[]> => {
  try {
    const q = query(
      collection(db, 'ga4_synced_funnels'),
      where('userId', '==', userId)
      // Removed orderBy to avoid needing an index - will sort in code instead
    );

    const querySnapshot = await getDocs(q);
    const funnels: GA4SyncedFunnel[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as GA4SyncedFunnelData;
      funnels.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        steps: data.steps,
        source: data.source,
        syncedAt: data.syncedAt.toDate(),
        lastSyncedAt: data.lastSyncedAt.toDate(),
        ga4Data: data.ga4Data
      });
    });

    // Sort by lastSyncedAt in code (newest first)
    funnels.sort((a, b) => b.lastSyncedAt.getTime() - a.lastSyncedAt.getTime());

    return funnels;
  } catch (error) {
    console.error('Error fetching GA4 synced funnels:', error);
    throw new Error('Failed to fetch GA4 synced funnels');
  }
};

/**
 * Update GA4 synced funnel (for re-sync)
 */
export const updateGA4SyncedFunnel = async (
  funnelId: string,
  steps: GA4FunnelStep[],
  ga4Data?: any
): Promise<void> => {
  try {
    const funnelRef = doc(db, 'ga4_synced_funnels', funnelId);
    await updateDoc(funnelRef, {
      steps,
      lastSyncedAt: Timestamp.now(),
      ga4Data
    });
  } catch (error) {
    console.error('Error updating GA4 synced funnel:', error);
    throw new Error('Failed to update GA4 synced funnel');
  }
};

/**
 * Delete a GA4 synced funnel
 */
export const deleteGA4SyncedFunnel = async (funnelId: string, userId: string): Promise<void> => {
  try {
    const funnelRef = doc(db, 'ga4_synced_funnels', funnelId);

    // Verify ownership before deleting
    const funnelDoc = await getDocs(query(
      collection(db, 'ga4_synced_funnels'),
      where('__name__', '==', funnelId),
      where('userId', '==', userId)
    ));

    if (funnelDoc.empty) {
      throw new Error('Funnel not found or unauthorized');
    }

    await deleteDoc(funnelRef);
    console.log('GA4 synced funnel deleted:', funnelId);
  } catch (error) {
    console.error('Error deleting GA4 synced funnel:', error);
    throw new Error('Failed to delete GA4 synced funnel');
  }
};

/**
 * Process and save multiple GA4 funnels from extension
 */
export const processSyncedFunnels = async (
  userId: string,
  funnels: any[]
): Promise<{ success: boolean; savedCount: number; errors: string[] }> => {
  const results = {
    success: true,
    savedCount: 0,
    errors: [] as string[]
  };

  for (const funnel of funnels) {
    try {
      // Transform funnel data to match our format
      const steps: GA4FunnelStep[] = funnel.steps.map((step: any, index: number) => ({
        name: step.name || `Step ${index + 1}`,
        activeUsers: step.activeUsers || 0,
        completionRate: step.completionRate || 0,
        abandonmentRate: step.abandonmentRate || 0,
        abandonments: step.abandonments || 0,
        elapsedTime: step.elapsedTime || 0,
        order: index + 1
      }));

      // Save to Firestore
      await saveGA4SyncedFunnel(
        userId,
        funnel.name || 'Untitled Funnel',
        steps,
        funnel
      );

      results.savedCount++;
    } catch (error: any) {
      console.error('Error saving funnel:', funnel.name, error);
      results.errors.push(`Failed to save ${funnel.name}: ${error.message}`);
      results.success = false;
    }
  }

  return results;
};
