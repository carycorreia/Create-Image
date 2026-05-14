import Replicate from "replicate";
import type { ImageData } from "../../../lib/firebase/imageStorage";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

type PersistResult = {
  savedImage: ImageData | null;
  persistStatus: "saved" | "skipped_no_admin" | "failed";
  persistHint?: string;
};

async function tryPersistGallery(
  imageUrl: string,
  userId: string,
  prompt: string,
  model: string
): Promise<PersistResult> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    return {
      savedImage: null,
      persistStatus: "skipped_no_admin",
      persistHint:
        "Gallery save is off: Vercel does not have FIREBASE_SERVICE_ACCOUNT_JSON. Add the full service-account JSON (one line) under Settings → Environment Variables, then Redeploy.",
    };
  }

  try {
    const { saveImageToStorage } = await import(
      "../../../lib/firebase/imageStorage.server"
    );
    const saved = await saveImageToStorage(imageUrl, userId, prompt, model);
    if (!saved) {
      return {
        savedImage: null,
        persistStatus: "failed",
        persistHint:
          "Could not save to Firebase (check Vercel function logs). Common causes: invalid FIREBASE_SERVICE_ACCOUNT_JSON, wrong NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, or Storage API disabled for the project.",
      };
    }
    return { savedImage: saved, persistStatus: "saved" };
  } catch (storageError) {
    const msg =
      storageError instanceof Error ? storageError.message : String(storageError);
    console.error("Storage error (non-fatal):", storageError);
    return {
      savedImage: null,
      persistStatus: "failed",
      persistHint: `Save failed: ${msg.slice(0, 280)}`,
    };
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, model = "flux-dev", userId } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log(`Generating image with model: ${model}, prompt: ${prompt}, userId: ${userId}`);
    let output;

    if (model === "ideogram-v2") {
      output = await replicate.run("ideogram-ai/ideogram-v2a", {
        input: {
          prompt: prompt,
          resolution: "None",
          style_type: "None",
          aspect_ratio: "16:9",
          magic_prompt_option: "Auto",
        },
      });
      const imageUrl = Array.isArray(output) ? output[0] : output;
      const persist = await tryPersistGallery(
        imageUrl as string,
        userId,
        prompt,
        model
      );

      return Response.json({
        output: imageUrl,
        savedImage: persist.savedImage,
        persistStatus: persist.persistStatus,
        persistHint: persist.persistHint,
      });
    }

    output = await replicate.run("black-forest-labs/flux-dev", {
      input: {
        prompt: prompt,
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    const persist = await tryPersistGallery(
      imageUrl as string,
      userId,
      prompt,
      model
    );

    return Response.json({
      output: imageUrl,
      savedImage: persist.savedImage,
      persistStatus: persist.persistStatus,
      persistHint: persist.persistHint,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Response.json(
      {
        error: `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
