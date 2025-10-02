import Replicate from "replicate";
import { saveImageToStorage } from "../../../lib/firebase/imageStorage";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { prompt, model = 'flux-dev', userId } = await req.json();

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log(`Generating image with model: ${model}, prompt: ${prompt}, userId: ${userId}`);
    let output;
    
    if (model === 'ideogram-v2') {
      output = await replicate.run(
        "ideogram-ai/ideogram-v2a",
        {
          input: {
            prompt: prompt,
            resolution: "None",
            style_type: "None",
            aspect_ratio: "16:9",
            magic_prompt_option: "Auto"
          }
        }
      );
      // Ideogram returns a different format - it might be a single URL or array
      const imageUrl = Array.isArray(output) ? output[0] : output;
      
      // Save to Firebase Storage
      let savedImage = null;
      try {
        savedImage = await saveImageToStorage(imageUrl, userId, prompt, model);
      } catch (storageError) {
        console.error('Storage error (non-fatal):', storageError);
        // Continue without saving to storage - image generation was successful
      }
      
      return Response.json({ 
        output: imageUrl,
        savedImage: savedImage
      });
    } else {
      // Default to flux-dev
      output = await replicate.run(
        "black-forest-labs/flux-dev",
        {
          input: {
            prompt: prompt,
          }
        }
      );
      
      // Save to Firebase Storage
      let savedImage = null;
      try {
        const imageUrl = Array.isArray(output) ? output[0] : output;
        savedImage = await saveImageToStorage(imageUrl, userId, prompt, model);
      } catch (storageError) {
        console.error('Storage error (non-fatal):', storageError);
        // Continue without saving to storage - image generation was successful
      }
      
      const imageUrl = Array.isArray(output) ? output[0] : output;
      return Response.json({ 
        output: imageUrl,
        savedImage: savedImage
      });
    }
  } catch (error) {
    console.error("Error generating image:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return Response.json(
      { error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
