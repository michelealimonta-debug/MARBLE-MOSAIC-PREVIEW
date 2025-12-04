import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Edits an image based on a text prompt using Gemini 2.5 Flash Image.
 * 
 * @param base64Image The source image in base64 format (data URL).
 * @param prompt The user's instruction for editing.
 * @returns The edited image as a base64 string.
 */
export const editImageWithGemini = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // Extract base64 data and mime type
    const match = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      throw new Error("Invalid base64 image format");
    }
    const mimeType = match[1];
    const data = match[2];

    const model = 'gemini-2.5-flash-image';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: mimeType,
            },
          },
          {
            text: `Edit this image strictly following this instruction: ${prompt}. Return only the edited image.`,
          },
        ],
      },
      // We do not use responseMimeType for image generation/editing in flash-image models
    });

    // Parse response to find the image part using optional chaining for safety
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    // Construct the data URL for the returned image
                    const responseMime = part.inlineData.mimeType || 'image/png';
                    return `data:${responseMime};base64,${part.inlineData.data}`;
                }
            }
        }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};