import { db, auth } from '@/config/firebase';
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';

export interface SavedFunnel {
  id: string;
  userId: string;
  name: string;
  data: any[];
  createdAt: Date;
  fileName?: string;
}

export interface ShareableFunnel {
  funnelId: string;
  shareId: string;
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
}

/**
 * Save a funnel to Firestore
 */
export const saveFunnel = async (name: string, data: any[], fileName?: string): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to save funnels');
  }

  const funnelId = `funnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const funnelRef = doc(db, 'funnels', funnelId);

  const funnelData: SavedFunnel = {
    id: funnelId,
    userId: user.uid,
    name,
    data,
    fileName,
    createdAt: new Date()
  };

  await setDoc(funnelRef, {
    ...funnelData,
    createdAt: Timestamp.fromDate(funnelData.createdAt)
  });

  return funnelId;
};

/**
 * Get all funnels for current user
 */
export const getUserFunnels = async (): Promise<SavedFunnel[]> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const funnelsQuery = query(
    collection(db, 'funnels'),
    where('userId', '==', user.uid)
  );

  const querySnapshot = await getDocs(funnelsQuery);
  const funnels: SavedFunnel[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    funnels.push({
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date()
    } as SavedFunnel);
  });

  // Sort by createdAt descending (most recent first) in JavaScript
  funnels.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return funnels;
};

/**
 * Get a specific funnel by ID
 */
export const getFunnelById = async (funnelId: string): Promise<SavedFunnel | null> => {
  const funnelRef = doc(db, 'funnels', funnelId);
  const funnelDoc = await getDoc(funnelRef);

  if (!funnelDoc.exists()) {
    return null;
  }

  const data = funnelDoc.data();
  return {
    ...data,
    id: funnelDoc.id,
    createdAt: data.createdAt?.toDate() || new Date()
  } as SavedFunnel;
};

/**
 * Create a shareable link for a funnel
 */
export const createShareableLink = async (funnelId: string): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Verify funnel ownership
  const funnelRef = doc(db, 'funnels', funnelId);
  const funnelDoc = await getDoc(funnelRef);

  if (!funnelDoc.exists()) {
    throw new Error('Funnel not found');
  }

  const funnelData = funnelDoc.data();
  if (funnelData.userId !== user.uid) {
    throw new Error('Unauthorized to share this funnel');
  }

  // Generate unique share ID
  const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const shareRef = doc(db, 'sharedFunnels', shareId);

  const shareData: ShareableFunnel = {
    funnelId,
    shareId,
    createdBy: user.uid,
    createdAt: new Date(),
    isPublic: true
  };

  await setDoc(shareRef, {
    ...shareData,
    createdAt: Timestamp.fromDate(shareData.createdAt)
  });

  // Return the shareable URL
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${shareId}`;
};

/**
 * Get funnel from share link
 */
export const getFunnelByShareId = async (shareId: string): Promise<SavedFunnel | null> => {
  const shareRef = doc(db, 'sharedFunnels', shareId);
  const shareDoc = await getDoc(shareRef);

  if (!shareDoc.exists()) {
    return null;
  }

  const shareData = shareDoc.data();

  // Get the actual funnel
  return await getFunnelById(shareData.funnelId);
};

/**
 * Delete a funnel
 */
export const deleteFunnel = async (funnelId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const funnelRef = doc(db, 'funnels', funnelId);
  const funnelDoc = await getDoc(funnelRef);

  if (!funnelDoc.exists()) {
    throw new Error('Funnel not found');
  }

  const funnelData = funnelDoc.data();
  if (funnelData.userId !== user.uid) {
    throw new Error('Unauthorized to delete this funnel');
  }

  await deleteDoc(funnelRef);
};

/**
 * Rename a funnel
 */
export const renameFunnel = async (funnelId: string, newName: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated');
  }

  if (!newName || newName.trim() === '') {
    throw new Error('Funnel name cannot be empty');
  }

  const funnelRef = doc(db, 'funnels', funnelId);
  const funnelDoc = await getDoc(funnelRef);

  if (!funnelDoc.exists()) {
    throw new Error('Funnel not found');
  }

  const funnelData = funnelDoc.data();
  if (funnelData.userId !== user.uid) {
    throw new Error('Unauthorized to rename this funnel');
  }

  await updateDoc(funnelRef, {
    name: newName.trim()
  });
};
