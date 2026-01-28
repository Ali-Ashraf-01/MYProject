import fs from "fs";
import { memory } from "../memory";
import { extractText, getDocumentProxy } from "unpdf";

export const pdfTool = {
  name: "pdf",
  description: "قراءة أو تلخيص ملف PDF",
  execute: async ({ input }: { input: string }) => {
    // Extract filepath from [PDF: path] format
    const match = input.match(/\[PDF:\s*([^\]]+)\]/);
    const filePath = match ? match[1].trim() : input.trim();
    
    if (!fs.existsSync(filePath)) return `❌ ملف PDF غير موجود: ${filePath}`;

    try {
      const buffer = fs.readFileSync(filePath);
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text, totalPages } = await extractText(pdf, { mergePages: true });

      // Extract user question if any
      const userQuestion = input.replace(/\[PDF:[^\]]+\]/, '').trim();
      
      const pdfText = Array.isArray(text) ? text.join('\n') : text;
      const output = `📄 PDF Summary:\nعدد الصفحات: ${totalPages}\n\nالمحتوى:\n${pdfText.slice(0, 2000)}${userQuestion ? `\n\nسؤال المستخدم: ${userQuestion}` : ''}`;
      memory.add(`[pdf]\n${output}`);
      return output;
    } catch (error: any) {
      return `❌ خطأ في قراءة PDF: ${error.message}`;
    }
  }
};
