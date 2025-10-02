import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const { db } = await import("../../../lib/firebase/firebase");
      const { collection, query, where, getDocs, deleteDoc, doc } = await import("firebase/firestore");
      
      if (!db) {
        return NextResponse.json({ error: "Firebase not initialized" }, { status: 500 });
      }

      const firestoreDb = db as any;
      
      // Get all images for the user
      const q = query(
        collection(firestoreDb, 'images'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const deletePromises: Promise<void>[] = [];
      
      console.log(`Found ${querySnapshot.size} images to delete for user ${userId}`);
      
      // Delete each image document
      querySnapshot.forEach((docSnapshot) => {
        console.log(`Deleting image: ${docSnapshot.id}`);
        deletePromises.push(deleteDoc(doc(firestoreDb, 'images', docSnapshot.id)));
      });
      
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
      
      console.log(`Successfully deleted ${querySnapshot.size} images`);
      
      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${querySnapshot.size} images`,
        deletedCount: querySnapshot.size
      });
    } else {
      return NextResponse.json({
        error: "Firebase not configured"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error deleting images:", error);
    return NextResponse.json(
      { error: `Failed to delete images: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
