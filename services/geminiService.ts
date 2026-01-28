import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { SourceImage, ObjectTransform, AspectRatio } from '../types';
import { translations } from '../locales/translations';
import { padImageToAspectRatioWithColor } from "../utils";

// Try multiples sources for the API Key to be robust across different environments (Vite, Vercel, Local)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set. Please assume the user needs to set VITE_GEMINI_API_KEY or GEMINI_API_KEY in their environment variables.");
} else if (API_KEY.includes('PLACEHOLDER')) {
  console.error("API_KEY is currently set to a placeholder value. Please update it in your Vercel settings.");
} else {
  console.log("Gemini Service: API Key found (starts with: " + API_KEY.substring(0, 4) + "...)");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

function formatPrompt(template: string, ...args: any[]): string {
  if (!template) return '';
  return template.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] !== 'undefined' ? args[number] : match;
  });
}


/**
 * Extracts the base64 image data from a Gemini API response.
 * @param response - The response object from the API.
 * @returns The base64 encoded image string, or null if not found.
 */
const extractBase64Image = (response: GenerateContentResponse): string | null => {
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * Generates multiple images based on a source image and a text prompt.
 * @param sourceImage - The source image object containing base64 data and mimeType.
 * @param prompt - The final, engineered text prompt to guide the image generation.
 * @param count - The number of images to generate.
 * @param referenceImage - An optional reference image for style, tone, and mood.
 * @param aspectRatio - The desired aspect ratio for text-to-image generation.
 * @param lang - The selected language for the engineered prompt.
 * @param negativePrompt - An optional string of keywords to exclude from the generation.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const generateImages = async (
  sourceImage: SourceImage | null,
  prompt: string,
  count: number = 2,
  referenceImage: SourceImage | null = null,
  aspectRatio: string = '4:3',
  lang: 'vi' | 'en' = 'vi',
  negativePrompt?: string
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured due to missing env var.");
  }
  if (API_KEY.includes('PLACEHOLDER')) {
    throw new Error("API_KEY is still using the PLACEHOLDER value. Please update it in Vercel Settings.");
  }

  console.log(`[GeminiService] generateImages called. Count: ${count}, Prompt: ${prompt.substring(0, 50)}...`); // DEBUG

  // CASE 1: Text-to-Image generation (no source image). Use Imagen 4 model.
  if (!sourceImage) {
    try {
      console.log("[GeminiService] Mode: Text-to-Image (Imagen 3)"); // DEBUG
      let finalPrompt = prompt;
      if (negativePrompt && negativePrompt.trim() !== '') {
        // Embed the negative prompt into the main prompt as the dedicated parameter is not supported for this call.
        finalPrompt = `${prompt}. Do not include: ${negativePrompt}`;
      }
      const config: any = {
        numberOfImages: count,
        outputMimeType: 'image/png', // Using PNG for better quality
        aspectRatio: aspectRatio, // Use the passed aspect ratio
      };
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: finalPrompt,
        config,
      });
      return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    } catch (error) {
      console.error(`Failed to generate images from text prompt:`, error);
      return []; // Return empty array on failure
    }
  } else {
    // CASE 2: Image-to-Image / Multi-modal generation (source image is present). Use Gemini model.
    const results: (string | null)[] = [];
    for (let i = 0; i < count; i++) {
      let engineeredPrompt = prompt;
      const parts: any[] = [];

      // Always add the source image first
      parts.push({
        inlineData: {
          data: sourceImage.base64,
          mimeType: sourceImage.mimeType,
        },
      });

      // Add reference image if provided
      if (referenceImage) {
        parts.push({
          inlineData: {
            data: referenceImage.base64,
            mimeType: referenceImage.mimeType,
          },
        });
        // The prompt for using source + reference
        const template = (negativePrompt && negativePrompt.trim() !== '')
          ? translations[lang].engineeredPrompts.generateWithReferenceNegative
          : translations[lang].engineeredPrompts.generateWithReference;
        engineeredPrompt = formatPrompt(template, prompt, negativePrompt);
      } else {
        const template = (negativePrompt && negativePrompt.trim() !== '')
          ? translations[lang].engineeredPrompts.generateWithoutReferenceNegative
          : translations[lang].engineeredPrompts.generateWithoutReference;
        engineeredPrompt = formatPrompt(template, prompt, negativePrompt);
      }

      parts.push({ text: engineeredPrompt });

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: { parts },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
        results.push(extractBase64Image(response));
      } catch (error) {
        console.error(`Failed to generate image ${i + 1}/${count}:`, error);
        // Continue to the next iteration even if one fails
      }
    }

    return results.filter((result): result is string => result !== null);
  }
};

/**
 * Generates a video based on a source image and a text prompt.
 * @param sourceImage - The source image object containing base64 data and mimeType.
 * @param prompt - The text prompt to guide the video generation.
 * @param model - The name of the Veo model to use for generation.
 * @param onProgress - A callback function to report progress updates.
 * @returns A promise that resolves to a blob URL of the generated video.
 */
export const generateVideo = async (
  sourceImage: SourceImage,
  prompt: string,
  model: string,
  onProgress: (message: string) => void
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const progressMessages = [
    "AI is warming up the virtual cameras...",
    "Analyzing the scene and your prompt...",
    "Storyboarding the first few frames...",
    "Rendering the motion sequence...",
    "Adding final touches and visual effects...",
    "This can take a few minutes, hang tight!",
  ];

  try {
    onProgress("Initializing video generation...");
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      image: {
        imageBytes: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
      config: {
        numberOfVideos: 1,
      }
    });

    let messageIndex = 0;
    onProgress(progressMessages[messageIndex]);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      messageIndex = (messageIndex + 1) % progressMessages.length;
      onProgress(progressMessages[messageIndex]);
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onProgress("Video generated! Downloading...");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation succeeded but no download link was found.");
    }

    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    onProgress("Download complete!");

    return videoUrl;

  } catch (error) {
    console.error("Failed to generate video:", error);
    throw error; // Re-throw to be caught by the UI
  }
};


/**
 * Classifies an image as either 'interior' or 'exterior'.
 * @param sourceImage - The image to classify.
 * @returns A promise that resolves to 'interior' or 'exterior'.
 */
export const classifyImageType = async (
  sourceImage: SourceImage
): Promise<'interior' | 'exterior'> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const engineeredPrompt = translations.vi.engineeredPrompts.classifyImageTypePrompt;

  const parts: any[] = [
    {
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    },
    { text: engineeredPrompt },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    const result = response.text.trim().toLowerCase();
    if (result.includes('interior')) {
      return 'interior';
    }
    return 'exterior'; // Default to exterior
  } catch (error) {
    console.error("Failed to classify image type:", error);
    return 'exterior'; // Default to exterior on error
  }
};


/**
 * Generates a descriptive prompt from a source image.
 * @param sourceImage - The image to analyze.
 * @param lang - The selected language for the engineered prompt.
 * @param imageType - The type of image (interior or exterior) to select the correct prompt template.
 * @returns A promise that resolves to the generated text prompt.
 */
export const generatePromptFromImage = async (
  sourceImage: SourceImage,
  lang: 'vi' | 'en' = 'vi',
  imageType: 'interior' | 'exterior' = 'exterior'
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const templateKey = imageType === 'interior' ? 'generateFromImageInterior' : 'generateFromImage';
  const engineeredPrompt = translations[lang].engineeredPrompts[templateKey];

  const parts: any[] = [
    {
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    },
    { text: engineeredPrompt },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Failed to generate prompt from image:", error);
    throw new Error("Could not generate promt from image.");
  }
};

/**
 * Generates a descriptive prompt from user-provided keywords.
 * @param keywords - The user's input keywords.
 * @param lang - The selected language for the engineered prompt.
 * @param imageType - The type of image (interior or exterior) to select the correct prompt template.
 * @returns A promise that resolves to the generated text prompt.
 */
export const generatePromptFromKeywords = async (
  keywords: string,
  lang: 'vi' | 'en' = 'vi',
  imageType: 'interior' | 'exterior' = 'exterior'
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const templateKey = imageType === 'interior' ? 'generateFromKeywordsInterior' : 'generateFromKeywords';
  const template = translations[lang].engineeredPrompts[templateKey];
  const engineeredPrompt = formatPrompt(template, keywords);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: engineeredPrompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Failed to generate prompt from keywords:", error);
    throw new Error("Could not generate promt from keywords.");
  }
};


/**
 * Edits a specific region of an image using a mask and a text prompt.
 * @param sourceImage - The original image to be edited.
 * @param maskImage - An image where the white area indicates the region to edit.
 * @param prompt - The text prompt describing the desired changes.
 * @param count - The number of edited images to generate.
 * @param referenceImage - An optional reference image for style guidance.
 * @param lang - The selected language for the engineered prompt.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const editImage = async (
  sourceImage: SourceImage,
  maskImage: SourceImage,
  prompt: string,
  count: number = 2,
  referenceImage: SourceImage | null = null,
  lang: 'vi' | 'en' = 'vi'
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const results: (string | null)[] = [];

  for (let i = 0; i < count; i++) {
    // FIX: Explicitly type `parts` as `any[]` to allow for a mix of inlineData and text parts, resolving a potential TypeScript type inference error.
    const parts: any[] = [
      {
        inlineData: {
          data: sourceImage.base64,
          mimeType: sourceImage.mimeType,
        },
      },
      {
        inlineData: {
          data: maskImage.base64,
          mimeType: maskImage.mimeType,
        },
      },
    ];

    let engineeredPrompt: string;

    if (referenceImage) {
      parts.push({
        inlineData: {
          data: referenceImage.base64,
          mimeType: referenceImage.mimeType,
        },
      });
      const template = translations[lang].engineeredPrompts.editWithReference;
      engineeredPrompt = formatPrompt(template, prompt);
    } else {
      const template = translations[lang].engineeredPrompts.editWithoutReference;
      engineeredPrompt = formatPrompt(template, prompt);
    }

    parts.push({ text: engineeredPrompt });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      }
      );
      results.push(extractBase64Image(response));
    } catch (error) {
      console.error(`Failed to edit image ${i + 1}/${count}:`, error);
      // Continue to the next iteration even if one fails
    }
  }

  return results.filter((result): result is string => result !== null);
};

/**
 * Merges two images based on a text prompt.
 * @param image1 - The first source image.
 * @param image2 - The second source image.
 * @param prompt - The text prompt describing how to merge the images.
 * @param count - The number of merged images to generate.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const mergeImages = async (
  image1: SourceImage,
  image2: SourceImage,
  prompt: string,
  count: number = 2,
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const results: (string | null)[] = [];
  for (let i = 0; i < count; i++) {
    const engineeredPrompt = prompt;

    // FIX: Explicitly type `parts` as `any[]` to allow for a mix of inlineData and text parts, resolving a potential TypeScript type inference error.
    const parts: any[] = [
      { inlineData: { data: image1.base64, mimeType: image1.mimeType } },
      { inlineData: { data: image2.base64, mimeType: image2.mimeType } },
      { text: engineeredPrompt },
    ];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      results.push(extractBase64Image(response));
    } catch (error) {
      console.error(`Failed to generate merged image ${i + 1}/${count}:`, error);
    }
  }

  return results.filter((result): result is string => result !== null);
};

/**
 * Places furniture/decor objects into a background scene using AI.
 * @param bgImage - The background image of the room/space.
 * @param placements - An array of objects to place, each with an image and transform data.
 * @param count - The number of variations to generate.
 * @param lang - The selected language for the engineered prompt.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const placeAndRenderFurniture = async (
  bgImage: SourceImage,
  placements: { image: SourceImage; transform: ObjectTransform }[],
  count: number = 2,
  lang: 'vi' | 'en' = 'vi'
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  if (placements.length === 0) {
    return [];
  }

  const simplifiedPlacements = placements.map(({ transform }) => ({
    pos: { x: transform.x.toFixed(2), y: transform.y.toFixed(2) }, // Position in % from top-left
    scale: transform.scale.toFixed(2), // Scale in % of background width
    rotation: transform.rotation.toFixed(0), // Rotation in degrees
    orientation: {
      flip_horizontal: transform.flipHorizontal,
      flip_vertical: transform.flipVertical,
    }
  }));

  const template = translations[lang].engineeredPrompts.placeAndRenderFurniture;
  const engineeredPrompt = formatPrompt(template, JSON.stringify(simplifiedPlacements, null, 2));

  const results: (string | null)[] = [];
  for (let i = 0; i < count; i++) {
    const parts: any[] = [
      { inlineData: { data: bgImage.base64, mimeType: bgImage.mimeType } },
      ...placements.map(p => ({ inlineData: { data: p.image.base64, mimeType: p.image.mimeType } })),
      { text: engineeredPrompt },
    ];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      results.push(extractBase64Image(response));
    } catch (error) {
      console.error(`Failed to generate canva image ${i + 1}/${count}:`, error);
    }
  }

  return results.filter((result): result is string => result !== null);
};

/**
 * Generates a list of architectural photography prompts from a source image.
 * @param sourceImage - The image to analyze.
 * @param lang - The selected language for the engineered prompt.
 * @returns A promise that resolves to the generated text containing multiple prompts.
 */
export const generateArchitecturalPrompts = async (
  sourceImage: SourceImage,
  lang: 'vi' | 'en' = 'vi'
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const engineeredPrompt = translations[lang].engineeredPrompts.generateArchitecturalPrompts;

  const parts: any[] = [
    {
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    },
    { text: engineeredPrompt },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    const rawText = response.text.trim();

    // Remove conversational intro. The valid content starts with the first header (e.g., "1️⃣...").
    const firstHeaderIndex = rawText.search(/\d+️⃣/);
    const contentText = firstHeaderIndex !== -1 ? rawText.substring(firstHeaderIndex) : rawText;

    // Remove any markdown like asterisks and list bullets.
    const cleanedText = contentText
      .replace(/\*/g, '') // Remove ALL asterisks, not just **
      .replace(/^\s*[-•]\s*/gm, ''); // Remove leading list markers

    return cleanedText.trim();
  } catch (error) {
    console.error("Failed to generate architectural prompts from image:", error);
    throw new Error("Could not generate prompts from image.");
  }
};

/**
 * Generates a descriptive prompt from a 2D floor plan image.
 * @param sourceImage - The 2D plan image to analyze.
 * @param lang - The selected language for the engineered prompt.
 * @returns A promise that resolves to the generated text prompt.
 */
export const generatePromptFromPlan = async (
  sourceImage: SourceImage,
  lang: 'vi' | 'en' = 'vi'
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const engineeredPrompt = translations[lang].engineeredPrompts.generateFromPlan;

  const parts: any[] = [
    {
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    },
    { text: engineeredPrompt },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Failed to generate prompt from plan:", error);
    throw new Error("Could not generate prompt from plan.");
  }
};

/**
 * Generates a moodboard image from a source image and a text prompt.
 * @param sourceImage - The source image for inspiration.
 * @param userPrompt - The text prompt describing the moodboard's theme.
 * @param referenceImage - An optional reference image for style guidance.
 * @param imageCount - The number of moodboards to generate.
 * @param lang - The selected language for the engineered prompt.
 * @returns A promise that resolves to an array of base64 image URLs of the moodboards.
 */
export const generateMoodboard = async (
  sourceImage: SourceImage,
  userPrompt: string,
  referenceImage: SourceImage | null,
  imageCount: number,
  lang: 'vi' | 'en' = 'vi'
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured due to missing env var.");
  }
  if (API_KEY.includes('PLACEHOLDER')) {
    throw new Error("API_KEY is still using the PLACEHOLDER value. Please update it in Vercel Settings.");
  }

  const results: (string | null)[] = [];
  for (let i = 0; i < imageCount; i++) {
    const parts: any[] = [
      {
        inlineData: {
          data: sourceImage.base64,
          mimeType: sourceImage.mimeType,
        },
      },
    ];

    let engineeredPrompt: string;
    if (referenceImage) {
      parts.push({
        inlineData: {
          data: referenceImage.base64,
          mimeType: referenceImage.mimeType,
        },
      });
      const template = translations[lang].engineeredPrompts.generateMoodboardWithReference;
      engineeredPrompt = formatPrompt(template, userPrompt);
    } else {
      const template = translations[lang].engineeredPrompts.generateMoodboard;
      engineeredPrompt = formatPrompt(template, userPrompt);
    }

    parts.push({ text: engineeredPrompt });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      results.push(extractBase64Image(response));
    } catch (error) {
      console.error(`Failed to generate moodboard ${i + 1}/${imageCount}:`, error);
      // Continue to next iteration
    }
  }

  return results.filter((result): result is string => result !== null);
};

/**
 * Re-renders an image with a new lighting condition.
 * @param sourceImage - The source image to modify.
 * @param lightingPrompt - The description of the new lighting.
 * @param imageCount - The number of variations to generate.
 * @param lang - The selected language for the engineered prompt.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const applyLighting = async (
  sourceImage: SourceImage,
  lightingPrompt: string,
  imageCount: number,
  lang: 'vi' | 'en' = 'vi'
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const results: (string | null)[] = [];
  const template = translations[lang].engineeredPrompts.applyLighting;
  const engineeredPrompt = formatPrompt(template, lightingPrompt);

  for (let i = 0; i < imageCount; i++) {
    const parts: any[] = [
      { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } },
      { text: engineeredPrompt }
    ];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      results.push(extractBase64Image(response));
    } catch (error) {
      console.error(`Failed to generate lighting image ${i + 1}/${imageCount}:`, error);
    }
  }

  return results.filter((result): result is string => result !== null);
};

/**
 * Generates a video script prompt based on an image and a user request.
 * @param sourceImage - The source image for context.
 * @param userPrompt - The user's request in Vietnamese.
 * @param lang - The selected language (though the output is always English).
 * @returns A promise that resolves to the generated English video prompt.
 */
export const generateVideoScriptPrompt = async (
  sourceImage: SourceImage,
  userPrompt: string,
  lang: 'vi' | 'en' = 'vi'
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const engineeredPrompt = `hãy đóng vai một đạo diễn chuyên về quay phim kiến trúc,nội thất với hơn 20 năm kinh nghiệm và một chuyên gia viết promt chuyển từ ảnh thành video ngắn cho các ai kling và veo 3, bạn có kinh nghiệm về các góc camera, chuyển động của ánh sáng, bố cục và dựa vào tài liệu hàng đầu về nhiếp ảnh kiến trúc, nội thất. Khi tôi tải ảnh lên + yêu cầu bằng tiếng việt bạn hãy đựa vào đó viết promt tạo chuyển động cho ảnh theo chỉ định bằng tiếng anh, chỉ hiện promt ko hiện phân tích. Yêu cầu của người dùng là: "${userPrompt}"`;

  const parts: any[] = [
    {
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    },
    { text: engineeredPrompt },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Failed to generate video script prompt:", error);
    throw new Error("Could not generate video script prompt.");
  }
};

const parseAspectRatio = (ratio: AspectRatio): number => {
  if (ratio === 'auto') return 4 / 3;
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
};

/**
 * Extends an image to a new aspect ratio using AI outpainting.
 * @param sourceImage - The original image.
 * @param targetAspectRatioLabel - The label of the target aspect ratio (e.g., '16:9').
 * @param imageCount - The number of variations to generate.
 * @param lang - The selected language for the engineered prompt.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const extendView = async (
  sourceImage: SourceImage,
  targetAspectRatioLabel: AspectRatio,
  imageCount: number,
  lang: 'vi' | 'en' = 'vi'
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const targetAspectRatio = parseAspectRatio(targetAspectRatioLabel);
  const paddedImage = await padImageToAspectRatioWithColor(sourceImage, targetAspectRatio, '#FF00FF');

  const results: (string | null)[] = [];
  const engineeredPrompt = translations[lang].engineeredPrompts.extendView;

  for (let i = 0; i < imageCount; i++) {
    const parts: any[] = [
      { inlineData: { data: paddedImage.base64, mimeType: paddedImage.mimeType } },
      { text: engineeredPrompt }
    ];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      results.push(extractBase64Image(response));
    } catch (error) {
      console.error(`Failed to generate extended view image ${i + 1}/${imageCount}:`, error);
    }
  }

  return results.filter((result): result is string => result !== null);
};

/**
 * Generates a new, detailed prompt for changing the style of an image.
 * @param sourceImage The source image.
 * @param userPrompt The user's request for the new style.
 * @param lang The language for the engineered prompt.
 * @returns A promise that resolves to the generated text prompt.
 */
export const generateStyleChangePrompt = async (
  sourceImage: SourceImage,
  userPrompt: string,
  lang: 'vi' | 'en' = 'vi'
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const template = translations[lang].engineeredPrompts.changeStylePrompt;
  const engineeredPrompt = formatPrompt(template, userPrompt);

  const parts: any[] = [
    {
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    },
    { text: engineeredPrompt },
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Failed to generate style change prompt:", error);
    throw new Error("Could not generate style change prompt.");
  }
};

/**
 * Upscales and enhances an image based on a chosen level (subtle, balanced, creative).
 * @param sourceImage - The original image to be upscaled.
 * @param level - The level of enhancement ('subtle', 'balanced', 'creative').
 * @param lang - The selected language for prompt lookup.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const upscaleImage = async (
  sourceImage: SourceImage,
  level: 'subtle' | 'balanced' | 'creative',
  lang: 'vi' | 'en' = 'vi'
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  // Get the specific prompt for the chosen level
  const engineeredPrompt = translations[lang].engineeredPrompts.upscale[level];

  // For Upscaling, we usually just want 1 really good result, but for consistency we return an array.
  // Using gemini-2.5-flash-image as an image-to-image enhancer.
  const parts: any[] = [
    {
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    },
    { text: engineeredPrompt }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const image = extractBase64Image(response);
    return image ? [image] : [];
  } catch (error) {
    console.error(`Failed to upscale image:`, error);
    return [];
  }
};