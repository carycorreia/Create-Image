import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { imageId, userId } = await request.json();
    
    if (!imageId || !userId) {
      return NextResponse.json({ error: "Image ID and User ID are required" }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const { db } = await import("../../../lib/firebase/firebase");
      const { doc, deleteDoc, getDoc } = await import("firebase/firestore");
      
      if (!db) {
        return NextResponse.json({ error: "Firebase not initialized" }, { status: 500 });
      }

      const firestoreDb = db as any;
      
      // First, verify the image belongs to the user
      const imageRef = doc(firestoreDb, 'images', imageId);
      const imageDoc = await getDoc(imageRef);
      
      if (!imageDoc.exists()) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
      }
      
      const imageData = imageDoc.data();
      if (imageData.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized: Image does not belong to user" }, { status: 403 });
      }
      
      // Delete the image document
      await deleteDoc(imageRef);
      
      console.log(`Successfully deleted image: ${imageId}`);
      
      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
        imageId: imageId
      });
    } else {
      return NextResponse.json({
        error: "Firebase not configured"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
