/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Firebase Admin — server only.
 * Uses require() so webpack does not attempt to bundle firebase-admin.
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON in the environment.
 */

type GoogleServiceAccountKey = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  type?: string;
};

type App = { name: string };

function loadAdmin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return require("firebase-admin") as any;
}

export function getFirebaseAdminApp(): App | null {
  const admin = loadAdmin();
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;

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

    return admin.initializeApp({
      credential: admin.credential.cert(credentials),
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
  if (!app) return null;
  return loadAdmin().auth(app);
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return loadAdmin().firestore(app);
}

export function getAdminBucket() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  const name = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!name) return null;
  return loadAdmin().storage(app).bucket(name);
}
