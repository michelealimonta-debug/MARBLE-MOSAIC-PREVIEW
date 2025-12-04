import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    // Parse response to find the image part
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                // Construct the data URL for the returned image
                // Assuming PNG usually, but could be JPEG. The API usually returns what's requested or defaults.
                // We'll assume the MIME type provided by the response or default to png.
                const responseMime = part.inlineData.mimeType || 'image/png';
                return `data:${responseMime};base64,${part.inlineData.data}`;
            }
        }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};