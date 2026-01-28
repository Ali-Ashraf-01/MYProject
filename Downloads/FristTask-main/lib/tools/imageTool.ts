import { vertex } from "@ai-sdk/google-vertex";
import { memory } from "../memory";
import { generateText, generateImage, jsonSchema } from "ai";
import { model } from "../model";

// Gemini 3 Pro Image Preview لتوليد الصور
const imageModel = vertex.image("imagen-4.0-generate-001");

export const imageTool = {
  name: "generate_image",
  description: "توليد صورة عالية الجودة بناءً على وصف المستخدم",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      input: { type: "string", description: "وصف المستخدم للصورة" },
    },
    required: ["input"],
  }),

  async execute(
    { input }: { input: string }
  ) {
    try {
      
      const userMessageMatch = input.match(/سؤال المستخدم:\s*([\s\S]+)$/);
      const cleanPrompt = userMessageMatch ? userMessageMatch[1].trim() : input;

      console.log("[ImageTool] Clean prompt (Arabic):", cleanPrompt);

      const translationResult = await generateText({
        model,
        messages: [
          {
            role: "system",
            content: `
You are a translator. Translate the user's image description from Arabic to English.
Output ONLY the English translation, nothing else.
Make it descriptive and detailed for image generation.
            `
          },
          { role: "user", content: cleanPrompt }
        ],
      });

      const englishPrompt = (await translationResult.text).trim();
      console.log("[ImageTool] English prompt:", englishPrompt);

      
      const result = await generateImage({
        model: imageModel,
        prompt: englishPrompt,
        n: 1,
        aspectRatio: "1:1",
      });

      const image = result.images[0];
      const base64Image = image.base64;

      memory.add(`[generate_image] تم توليد الصورة بنجاح`);

      return {
        type: "image",
        data: base64Image,
        format: "base64",
      };

    } catch (err: any) {
      console.error("ImageTool Error:", err);
      return "❌ فشل توليد الصورة: " + err.message;
    }
  },
};
