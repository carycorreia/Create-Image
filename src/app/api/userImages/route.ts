import { getUserImages } from "../../../lib/firebase/imageStorage";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const images = await getUserImages(userId);
    return Response.json({ images });
  } catch (error) {
    console.error("Error fetching user images:", error);
    return Response.json(
      { error: "Failed to fetch user images" },
      { status: 500 }
    );
  }
}
