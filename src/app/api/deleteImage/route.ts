import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageId, userId } = await request.json();

    if (!imageId || !userId) {
      return NextResponse.json({ error: "Image ID and User ID are required" }, { status: 400 });
    }

    if (
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ) {
      return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 500 });
    }

    const { deleteImageAdmin } = await import("../../../lib/firebase/imageStorage.server");

    try {
      await deleteImageAdmin(imageId, userId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      if (message === "Image not found") {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      if (message === "Unauthorized") {
        return NextResponse.json(
          { error: "Unauthorized: Image does not belong to user" },
          { status: 403 }
        );
      }
      throw e;
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
      imageId,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: `Failed to delete image: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
