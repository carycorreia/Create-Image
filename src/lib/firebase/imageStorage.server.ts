import { randomUUID } from "crypto";
import type { ImageData } from "./imageStorage";
import { getAdminBucket, getAdminDb } from "./admin";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FieldValue, Timestamp } = require("firebase-admin/firestore");

function extensionFromContentType(contentType: string | null): string {
  if (!contentType) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "png";
}

function buildFirebaseDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

/**
 * Download from Replicate (or any URL), upload to Firebase Storage, write Firestore.
 * Uses Firebase Admin — bypasses client security rules. Requires FIREBASE_SERVICE_ACCOUNT_JSON.
 */
export async function saveImageToStorage(
  imageUrl: string,
  userId: string,
  prompt: string,
  model: string
): Promise<ImageData | null> {
  const db = getAdminDb();
  const bucket = getAdminBucket();
  if (!db || !bucket) {
    console.warn(
      "saveImageToStorage: Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON."
    );
    return null;
  }

  const res = await fetch(imageUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to download generated image: HTTP ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/png";
  const ext = extensionFromContentType(contentType);
  const objectPath = `generated/${userId}/${randomUUID()}.${ext}`;
  const file = bucket.file(objectPath);
  const downloadToken = randomUUID();

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
    resumable: false,
  });

  const downloadUrl = buildFirebaseDownloadUrl(bucket.name, objectPath, downloadToken);

  const docRef = await db.collection("images").add({
    userId,
    prompt,
    model,
    url: downloadUrl,
    storagePath: objectPath,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    id: docRef.id,
    userId,
    prompt,
    model,
    url: downloadUrl,
    storagePath: objectPath,
    createdAt: new Date(),
  };
}

/** Server routes: list images for a user (Admin SDK, no client auth). */
export async function getUserImagesAdmin(userId: string): Promise<ImageData[]> {
  const db = getAdminDb();
  if (!db) {
    console.warn("getUserImagesAdmin: Firebase Admin not configured");
    return [];
  }

  const snap = await db.collection("images").where("userId", "==", userId).get();
  const images: ImageData[] = [];

  snap.forEach((doc) => {
    const data = doc.data();
    images.push({
      id: doc.id,
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
}

/** Delete Firestore doc and Storage object when present. */
export async function deleteImageAdmin(imageId: string, userId: string): Promise<void> {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin not configured");
  }

  const ref = db.collection("images").doc(imageId);
  const doc = await ref.get();
  if (!doc.exists) {
    throw new Error("Image not found");
  }
  const data = doc.data()!;
  if (data.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Best-effort Storage delete — skip if no storagePath or bucket unavailable
  const storagePath = data.storagePath as string | undefined;
  if (storagePath) {
    try {
      const bucket = getAdminBucket();
      if (bucket) {
        await bucket.file(storagePath).delete({ ignoreNotFound: true });
      }
    } catch (e) {
      console.error("deleteImageAdmin: storage delete", e);
    }
  }

  await ref.delete();
}

export async function deleteAllImagesAdmin(userId: string): Promise<number> {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin not configured");
  }

  const snap = await db.collection("images").where("userId", "==", userId).get();
  let count = 0;

  // Get bucket once — null is fine, we'll just skip Storage deletes
  const bucket = getAdminBucket();

  for (const doc of snap.docs) {
    const data = doc.data();
    const storagePath = data.storagePath as string | undefined;
    if (storagePath && bucket) {
      try {
        await bucket.file(storagePath).delete({ ignoreNotFound: true });
      } catch (e) {
        console.error("deleteAllImagesAdmin: storage delete", e);
      }
    }
    await doc.ref.delete();
    count++;
  }

  return count;
}
