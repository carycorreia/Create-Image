import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, orderBy, getDocs, Firestore } from 'firebase/firestore';

export interface ImageData {
  id?: string;
  userId: string;
  prompt: string;
  model: string;
  url: string;
  createdAt: Date;
}

export async function saveImageToStorage(
  imageUrl: string,
  userId: string,
  prompt: string,
  model: string
): Promise<ImageData | null> {
  if (!db) {
    console.warn('Firebase not initialized, skipping image save');
    return null;
  }
  
  const firestoreDb = db as Firestore;
  
  try {
    console.log('Saving image to Firestore:', { imageUrl, userId, prompt, model });
    
    // For now, let's just save the metadata to Firestore with the original URL
    // This avoids the Firebase Storage upload issue
    const imageData: Omit<ImageData, 'id'> = {
      userId,
      prompt,
      model,
      url: imageUrl, // Use the original Replicate URL
      createdAt: new Date(),
    };
    
    console.log('Image data to save:', imageData);
    
    const docRef = await addDoc(collection(firestoreDb, 'images'), imageData);
    
    console.log('Successfully saved image with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...imageData,
    };
  } catch (error) {
    console.error('Error saving image to storage:', error);
    console.error('Error details:', error);
    throw error;
  }
}

export async function getUserImages(userId: string): Promise<ImageData[]> {
  if (!db) {
    console.warn('Firebase not initialized, returning empty array');
    return [];
  }
  
  const firestoreDb = db as Firestore;
  
  try {
    console.log('Fetching images for user:', userId);
    
    // Temporary fix: Query without orderBy to avoid index requirement
    const q = query(
      collection(firestoreDb, 'images'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const images: ImageData[] = [];
    
    console.log('Found', querySnapshot.size, 'images for user');
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Image data:', data);
      images.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as ImageData);
    });
    
    // Sort by createdAt in JavaScript since we can't use orderBy in the query
    images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    console.log('Returning images:', images);
    return images;
  } catch (error) {
    console.error('Error fetching user images:', error);
    console.error('Error details:', error);
    throw error;
  }
}
