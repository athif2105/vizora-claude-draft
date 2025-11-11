import { auth, db } from '@/config/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export const connectGoogleAnalytics = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/analytics.readonly');
    provider.addScope('https://www.googleapis.com/auth/analytics.manage.users.readonly');
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('No access token received');
    }

    await setDoc(doc(db, 'gaConnections', result.user.uid), {
      userId: result.user.uid,
      accessToken: credential.accessToken,
      connectedAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('GA connection error:', error);
    return { success: false, error: error.message };
  }
};

export const listGA4Properties = async () => {
  const listPropertiesFn = httpsCallable(functions, 'listGA4Properties');
  const result = await listPropertiesFn();
  return result.data;
};

export const fetchGA4FunnelData = async (params: {
  propertyId: string;
  startDate: string;
  endDate: string;
  funnelSteps: any[];
}) => {
  const fetchDataFn = httpsCallable(functions, 'fetchGA4FunnelData');
  const result = await fetchDataFn(params);
  return result.data;
};

export const testGA4Connection = async () => {
  const testConnectionFn = httpsCallable(functions, 'testGA4Connection');
  const result = await testConnectionFn();
  return result.data;
};
