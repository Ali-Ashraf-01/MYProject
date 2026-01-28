import { NextRequest, NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

export const runtime = "nodejs";

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: "us-central1",
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const model = vertexAI.getGenerativeModel({
     model: "gemini-3-pro"
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    });

    const reply =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text ??
      "No reply";

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
