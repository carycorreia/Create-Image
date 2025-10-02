export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    // Only fetch images if Firebase is configured
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const { getUserImages } = await import("../../../lib/firebase/imageStorage");
      const images = await getUserImages(userId);
      return Response.json({ images });
    } else {
      // Return empty array if Firebase is not configured
      return Response.json({ images: [] });
    }
  } catch (error) {
    console.error("Error fetching user images:", error);
    return Response.json(
      { error: "Failed to fetch user images" },
      { status: 500 }
    );
  }
}
