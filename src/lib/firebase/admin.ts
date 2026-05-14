import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type GoogleServiceAccountKey = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  type?: string;
};

/**
 * Server-only Firebase Admin. Requires FIREBASE_SERVICE_ACCOUNT_JSON
 * (full JSON of a service account key) in the environment.
 */
export function getFirebaseAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    return null;
  }

  try {
    const credentials = JSON.parse(raw) as GoogleServiceAccountKey;
    const projectId =
      credentials.project_id ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!projectId) {
      console.error("Firebase Admin: missing project id");
      return null;
    }
    if (!storageBucket) {
      console.error("Firebase Admin: missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
      return null;
    }

    return initializeApp({
      credential: cert(credentials as Parameters<typeof cert>[0]),
      projectId,
      storageBucket,
    });
  } catch (e) {
    console.error("Firebase Admin: failed to parse FIREBASE_SERVICE_ACCOUNT_JSON", e);
    return null;
  }
}

export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}

export function getAdminBucket() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  const name = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!name) return null;
  return getStorage(app).bucket(name);
}
