import { exaSearchTool } from "./exaSearchTool";
import { imageTool } from "./imageTool";
import { pdfTool } from "./pdfTool";
import { explainCodeTool } from "./explainCodeTool";
import { generateCodeTool } from "./generateCodeTool";
import { chatTool } from "./chatTool";
//import { weatherTool } from "./weatherTool";

// Export all tools for the Agent (keys should match each tool's `name`)
export const tools = {
  explain_code: explainCodeTool,
  generate_code: generateCodeTool,
  search: exaSearchTool,
  pdf: pdfTool,
  generate_image: imageTool,
  chat: chatTool,
  // weather: weatherTool,
};
