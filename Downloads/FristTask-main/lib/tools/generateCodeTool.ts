import { streamText } from "ai";
import { memory } from "../memory";

import { model } from "../model";

export const generateCodeTool = {
  name: "generate_code",
  description: "توليد كود بناءً على متطلبات",
  execute: async ({ input }: { input: string }) => {
    const result = await streamText({
      model,
      messages: [
        { role: "system", content: "أنت مساعد ذكي يكتب كود برمجي." },
        { role: "user", content: input }
      ],
    });

    const output = await result.text;
    memory.add(`[generate_code]\n${output}`);
    return output;
  }
};
