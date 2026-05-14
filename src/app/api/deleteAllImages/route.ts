import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (
      !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ) {
      return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 500 });
    }

    const { deleteAllImagesAdmin } = await import("../../../lib/firebase/imageStorage.server");
    const deletedCount = await deleteAllImagesAdmin(userId);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} images`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting images:", error);
    return NextResponse.json(
      { error: `Failed to delete images: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
