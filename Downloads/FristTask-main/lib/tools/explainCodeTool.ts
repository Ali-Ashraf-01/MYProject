import { streamText } from "ai";

import { memory } from "../memory";
import { model } from "../model";

function extractUserMessage(input: string) {
  // runAgent may prepend a long memory/context then add: "سؤال المستخدم:" at the end.
  const marker = "سؤال المستخدم:";
  const idx = input.lastIndexOf(marker);
  return (idx >= 0 ? input.slice(idx + marker.length) : input).trim();
}

function extractFencedCodeBlocks(text: string) {
  const blocks: string[] = [];
  const re = /```[a-zA-Z0-9_+-]*\r?\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const code = (m[1] ?? "").trim();
    if (code) blocks.push(code);
  }
  return blocks;
}

function looksLikeCode(text: string) {
  // Heuristic only.
  return (
    /```/.test(text) ||
    /\b(import|export|function|class|const|let|var|return|if|else|def|print|console\.log|SELECT|INSERT|UPDATE|DELETE)\b/i.test(
      text
    ) ||
    /[{};<>:=]|=>/.test(text)
  );
}

export const explainCodeTool = {
  name: "explain_code",
  description: "شرح كود برمجي خطوة خطوة",
  execute: async (
    { input }: { input: string },
    options?: { abortSignal?: AbortSignal }
  ) => {
    const userMessage = extractUserMessage(input);

    // If there's no code at all, don't waste a model call.
    if (!looksLikeCode(userMessage)) {
      const output =
        "من فضلك ابعت الكود اللي عايز شرحه (يفضل داخل ``` ... ```)، وقلّي عايز شرح اي جزء بالظبط.";
      memory.add(`[explain_code]\n${output}`);
      return output;
    }

    const codeBlocks = extractFencedCodeBlocks(userMessage);

    const prompt =
      codeBlocks.length > 0
        ? `الكود المراد شرحه:\n\n${codeBlocks
            .map(
              (c, i) =>
                "# جزء " +
                (i + 1) +
                "\n\n```\n" +
                c +
                "\n```\n"
            )
            .join("\n")}\n\nملاحظة: لو فيه سؤال إضافي غير الكود موجود في الرسالة، خده في الاعتبار:\n${userMessage}`
        : `النص المرسل من المستخدم (قد يحتوي على كود):\n${userMessage}`;

    const result = await streamText({
      model,
      messages: [
        {
          role: "system",
          content:
            "أنت مساعد متخصص في شرح الأكواد خطوة بخطوة بالعربية. تجاهل أي سجل محادثة/ذاكرة أو رموز مثل [user]/[assistant] وركّز فقط على الكود. ابدأ بملخص سريع، ثم اشرح كل جزء، ثم اذكر أي أخطاء/تحسينات محتملة.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      abortSignal: options?.abortSignal,
    });

    const output = await result.text;
    memory.add(`[explain_code]\n${output}`);
    return output;
  },
};
