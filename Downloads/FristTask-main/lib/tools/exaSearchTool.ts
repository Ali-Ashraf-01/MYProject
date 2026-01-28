import Exa from "exa-js";
import { jsonSchema } from "ai";
import { memory } from "../memory";

if (!process.env.EXA_API_KEY) {
  throw new Error("Missing EXA_API_KEY");
}

const exa = new Exa(process.env.EXA_API_KEY);

type ExaSearchInput = { input: string };
type ExaSearchOutput = {
  results: {
    title: string;
    text: string;
    url: string;
  }[];
};

export const exaSearchTool = {
  name: "search",
  description: "بحث في الإنترنت باستخدام Exa API",

  inputSchema: jsonSchema<ExaSearchInput>({
    type: "object",
    properties: {
      input: { type: "string", description: "رسالة المستخدم" },
    },
    required: ["input"],
  }),

  outputSchema: jsonSchema<ExaSearchOutput>({
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            text: { type: "string" },
            url: { type: "string" },
          },
          required: ["title", "url"],
        },
      },
    },
    required: ["results"],
  }),

  execute: async ({ input }: ExaSearchInput): Promise<ExaSearchOutput | string> => {
    try {
      const result = await exa.searchAndContents(input, { numResults: 5, text: true });

      const output: ExaSearchOutput = {
        results: result.results.map(r => ({
          title: r.title ?? "بدون عنوان", // ✅ هنا الحل
          text: r.text?.slice(0, 300) || "",
          url: r.url,
        })),
      };

      memory.add(`[search]\n${JSON.stringify(output, null, 2)}`);

      return output;

    } catch (error: any) {
      console.error("خطأ أثناء تنفيذ البحث:", error);
      return "❌ حدث خطأ أثناء البحث، حاول مرة أخرى.";
    }
  },
};
