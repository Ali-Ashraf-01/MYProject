import { memory } from "./memory";
import { model } from "./model";
import { explainCodeTool } from "./tools/explainCodeTool";
import { generateCodeTool } from "./tools/generateCodeTool";
import { exaSearchTool } from "./tools/exaSearchTool";
import { pdfTool } from "./tools/pdfTool";
import { imageTool } from "./tools/imageTool";
import { chatTool } from "./tools/chatTool";
import { streamText } from "ai";

// ===== Tool Registry =====
const tools: Record<string, any> = {
  explain_code: explainCodeTool,
  generate_code: generateCodeTool,
  search: exaSearchTool,
  pdf: pdfTool,

  generate_image: imageTool,
  chat: chatTool, // ✅ للمحادثات العادية
};

// ===== Tool Selector =====
async function decideTool(userMessage: string) {
  const result = await streamText({
    model,
    messages: [
      {
        role: "system",
        content: `أنت محدد أدوات. اختر الأداة المناسبة بناءً على الكلمات المفتاحية:

explain_code: إذا طلب المستخدم "شرح", "اشرح", "فهم", "وضح", "ايه دا", "بيعمل ايه", "explain", "كود", "code"
generate_code: إذا طلب "اكتب", "اعمل", "أنشئ", "create", "write", "build" كود جديد
search: إذا طلب "ابحث", "دور", "search", "أخبار", "معلومات عن"
pdf: إذا كانت الرسالة تحتوي على "[PDF:" أو طلب قراءة/تلخيص PDF
generate_image: إذا طلب "صورة", "ارسم", "image", "generate image", "عدل الصورة", "عدل على الصورة", "اكتب على الصورة", "اكتب عليها", "غير الصورة", "حط على الصورة", "ضيف على الصورة", "edit image", "modify image"
chat: فقط للتحيات (مرحبا, هلا, ازيك) والأسئلة العامة غير التقنية

مهم جداً:
- إذا كان فيه كود في الرسالة وطلب شرح → explain_code
- إذا المستخدم بيتكلم عن صورة سابقة أو عايز يعدل عليها → generate_image
- إذا المستخدم قال "عليها" أو "على الصورة" → generate_image
ارجع اسم الأداة فقط (كلمة واحدة).`
      },
      { role: "user", content: userMessage }
    ],
  });

const rawText = (await result.text).trim();
  const cleanedToolName = rawText
  .toLowerCase()
  .replace(/[-\s]/g, '_')      
  .replace(/[^a-z_]/g, '');   
  console.log(`[Tool Selector] Raw: "${rawText}" -> Cleaned: "${cleanedToolName}"`);
  //return tools[cleanedToolName] ? cleanedToolName : null;
  return tools[cleanedToolName] ?? "chat";
}

// ===== Agent Executor =====
export async function runAgent(
  userMessage: string,
  abortSignal?: AbortSignal
) {
 
  memory.add(`👤 USER:\n${userMessage}`);

  const context = memory.getContext();
  const toolName = await decideTool(userMessage);

  if (!toolName) {
    memory.add("❌ لم يتم تحديد أداة مناسبة");
    return "❌ لم أستطع تحديد الأداة المناسبة.";
  }

  memory.add(`🧠 TOOL SELECTED: ${toolName}`);

  const tool = tools[toolName];

  try {
    const output = await tool.execute(
      { input: `${context}\n\nسؤال المستخدم:\n${userMessage}` },
      {
        abortSignal,
        onAbort: () => {
          memory.add("⛔ تم إيقاف التنفيذ بواسطة المستخدم");
        }
      }
    );

    memory.add(`✅ TOOL OUTPUT:\n${output}`);

    return {
      tool: toolName,
      output,
      memory: memory.getContext(),
    };
  } catch (err: any) {
    if (abortSignal?.aborted) {
      memory.add("⛔ التنفيذ توقف (AbortSignal)");
      return {
        tool: toolName,
        output: "⛔ تم إيقاف الطلب بواسطة المستخدم",
        memory: memory.getContext(),
      };
    }

    memory.add(`❌ ERROR:\n${err.message}`);
    throw err;
  }
}
