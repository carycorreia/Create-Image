import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Firestore,
  Timestamp,
} from "firebase/firestore";

export interface ImageData {
  id?: string;
  userId: string;
  prompt: string;
  model: string;
  url: string;
  /** Firebase Storage object path (set when saved via Admin). */
  storagePath?: string;
  createdAt: Date;
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

/**
 * Client-only: reads the signed-in user's gallery from Firestore.
 * Writes go through `/api/generateImage` using Firebase Admin (`imageStorage.server.ts`).
 */
export async function getUserImages(userId: string): Promise<ImageData[]> {
  if (!db) {
    console.warn("Firebase not initialized, returning empty array");
    return [];
  }

  const firestoreDb = db as Firestore;

  try {
    const q = query(collection(firestoreDb, "images"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const images: ImageData[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      images.push({
        id: docSnap.id,
        userId: data.userId,
        prompt: data.prompt,
        model: data.model,
        url: data.url,
        storagePath: data.storagePath,
        createdAt: toDate(data.createdAt),
      });
    });

    images.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return images;
  } catch (error) {
    console.error("Error fetching user images:", error);
    throw error;
  }
}
