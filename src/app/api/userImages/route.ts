import { getAdminAuth, getFirebaseAdminApp } from "../../../lib/firebase/admin";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }
    const idToken = authHeader.slice(7).trim();

    const app = getFirebaseAdminApp();
    const adminAuth = getAdminAuth();
    if (!app || !adminAuth || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
      return Response.json({
        images: [],
        setupError:
          "Server is missing FIREBASE_SERVICE_ACCOUNT_JSON. Add it in Vercel → Settings → Environment Variables (one-line service account JSON), then Redeploy.",
      });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      return Response.json({ error: "Invalid or expired session. Try signing out and back in." }, { status: 401 });
    }

    if (decoded.uid !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { getUserImagesAdmin } = await import("../../../lib/firebase/imageStorage.server");
    const images = await getUserImagesAdmin(userId);
    return Response.json({ images });
  } catch (error) {
    console.error("Error fetching user images:", error);
    return Response.json(
      { error: "Failed to fetch user images" },
      { status: 500 }
    );
  }
}
