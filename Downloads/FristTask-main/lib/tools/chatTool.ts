import { jsonSchema, streamText } from "ai";
import { model } from "../model";

export const chatTool = {
  name: "chat",
  description: "للمحادثات العادية والتحيات والأسئلة العامة",
  inputSchema: jsonSchema({
    type: "object",
    properties: {
      input: { type: "string", description: "رسالة المستخدم" },
    },
    required: ["input"], 
  }),

  async execute(
    { input }: { input: string },
    options?: { abortSignal?: AbortSignal; onAbort?: () => void }
  ) {
    const result = await streamText({
      model,
      messages: [
        {
          role: "system",
          content: `أنت مساعد ذكي ودود. رد على المستخدم بطريقة طبيعية ومفيدة. استخدم اللغة العربية.`,
        },
        { role: "user", content: input },
      ],
      abortSignal: options?.abortSignal,
    });

    return await result.text;
  },
};
