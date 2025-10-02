import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Only run this if Firebase is configured
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const { getUserImages } = await import("../../../lib/firebase/imageStorage");
      
      // This is a diagnostic endpoint - you would need to pass a userId
      // For now, just return instructions
      return NextResponse.json({
        message: "This endpoint can be used to diagnose image URL issues",
        instructions: [
          "1. Add ?userId=YOUR_USER_ID to the URL",
          "2. This will fetch all your images and check their URLs",
          "3. It will identify which images have missing or invalid URLs"
        ]
      });
    } else {
      return NextResponse.json({
        message: "Firebase not configured"
      });
    }
  } catch (error) {
    console.error("Error in cleanup endpoint:", error);
    return NextResponse.json(
      { error: "Failed to run cleanup" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      const { getUserImages } = await import("../../../lib/firebase/imageStorage");
      
      const images = await getUserImages(userId);
      
      // Analyze the images
      const analysis = images.map((img, index) => ({
        index,
        id: img.id,
        prompt: img.prompt,
        model: img.model,
        hasUrl: !!img.url,
        url: img.url,
        urlType: typeof img.url,
        urlLength: img.url ? img.url.length : 0,
        createdAt: img.createdAt,
        issues: [] as string[]
      }));

      // Identify issues
      analysis.forEach(img => {
        if (!img.hasUrl) {
          img.issues.push("Missing URL");
        } else if (typeof img.url !== 'string') {
          img.issues.push("URL is not a string");
        } else if (img.url.length === 0) {
          img.issues.push("Empty URL");
        } else if (!img.url.startsWith('http')) {
          img.issues.push("Invalid URL format");
        }
      });

      const problematicImages = analysis.filter(img => img.issues.length > 0);
      
      return NextResponse.json({
        totalImages: images.length,
        problematicImages: problematicImages.length,
        analysis,
        summary: {
          totalImages: images.length,
          imagesWithIssues: problematicImages.length,
          imagesWorking: images.length - problematicImages.length
        }
      });
    } else {
      return NextResponse.json({
        message: "Firebase not configured"
      });
    }
  } catch (error) {
    console.error("Error analyzing images:", error);
    return NextResponse.json(
      { error: "Failed to analyze images" },
      { status: 500 }
    );
  }
}
