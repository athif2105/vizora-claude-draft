import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export type AnnotationType = 'insight' | 'warning' | 'action' | 'note';

export interface Annotation {
  id: string;
  funnelId: string;
  stepName: string;
  stepIndex: number;
  type: AnnotationType;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AnnotationData {
  funnelId: string;
  stepName: string;
  stepIndex: number;
  type: AnnotationType;
  content: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Add a new annotation to a funnel step
 */
export const addAnnotation = async (
  funnelId: string,
  stepName: string,
  stepIndex: number,
  type: AnnotationType,
  content: string,
  userId: string
): Promise<string> => {
  try {
    const annotationData: AnnotationData = {
      funnelId,
      stepName,
      stepIndex,
      type,
      content,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'annotations'), annotationData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding annotation:', error);
    throw new Error('Failed to add annotation');
  }
};

/**
 * Get all annotations for a specific funnel
 */
export const getFunnelAnnotations = async (funnelId: string): Promise<Annotation[]> => {
  try {
    const q = query(
      collection(db, 'annotations'),
      where('funnelId', '==', funnelId),
      orderBy('stepIndex', 'asc'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const annotations: Annotation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as AnnotationData;
      annotations.push({
        id: doc.id,
        funnelId: data.funnelId,
        stepName: data.stepName,
        stepIndex: data.stepIndex,
        type: data.type,
        content: data.content,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      });
    });

    return annotations;
  } catch (error) {
    console.error('Error fetching annotations:', error);
    throw new Error('Failed to fetch annotations');
  }
};

/**
 * Update an existing annotation
 */
export const updateAnnotation = async (
  annotationId: string,
  content: string,
  type: AnnotationType
): Promise<void> => {
  try {
    const annotationRef = doc(db, 'annotations', annotationId);
    await updateDoc(annotationRef, {
      content,
      type,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating annotation:', error);
    throw new Error('Failed to update annotation');
  }
};

/**
 * Delete an annotation
 */
export const deleteAnnotation = async (annotationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'annotations', annotationId));
  } catch (error) {
    console.error('Error deleting annotation:', error);
    throw new Error('Failed to delete annotation');
  }
};

/**
 * Get annotations for a specific step
 */
export const getStepAnnotations = async (
  funnelId: string,
  stepIndex: number
): Promise<Annotation[]> => {
  try {
    const q = query(
      collection(db, 'annotations'),
      where('funnelId', '==', funnelId),
      where('stepIndex', '==', stepIndex),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const annotations: Annotation[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as AnnotationData;
      annotations.push({
        id: doc.id,
        funnelId: data.funnelId,
        stepName: data.stepName,
        stepIndex: data.stepIndex,
        type: data.type,
        content: data.content,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      });
    });

    return annotations;
  } catch (error) {
    console.error('Error fetching step annotations:', error);
    throw new Error('Failed to fetch step annotations');
  }
};
