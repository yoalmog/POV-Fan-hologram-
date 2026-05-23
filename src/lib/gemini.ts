import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API Client
// Note: React (Vite) uses process.env.GEMINI_API_KEY which is injected by AI Studio.
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not available in the environment.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

/**
 * Generates an image using gemini-2.5-flash-image based on a user prompt.
 * Optimized specifically for WS2812B POV hologram displays.
 */
export async function generateHologramLogo(prompt: string): Promise<string> {
  const ai = getGenAIClient();
  
  const systemPrompt = `Create a high-contrast circular logo or icon for a POV (Persistence of Vision) spinning LED hologram display.
Subject: "${prompt}".
Display specs & design instructions:
- Circular boundary: The image will be cropped to a circle. The logo MUST be fully enclosed in a central circle with plenty of margin.
- SOLID BLACK BACKGROUND (#000000): In POV displays, black pixels correspond to OFF (unlit) LEDs, which become transparent in the air. The background MUST be pure black.
- VIVID, SATURATED NEON COLORS: Use extremely bright, solid neon colors (neon cyan, fluorescent green, warning orange, glowing violet, hot pink). These colors stand out magnificently on LEDs.
- STROKE & SILHOUETTE DESIGN: Clean, thick lines and high contrast shapes. Avoid complex gradients, textures, soft shadows, or tiny details, as they will look blurry and messy on a 45-LED radius sweep.
- NO SMALL TEXT: Do not place text unless it is a single big letter or a prominent bold word.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: systemPrompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Check the response parts to find the generated base64 image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data returned from Gemini API");
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    throw error;
  }
}
