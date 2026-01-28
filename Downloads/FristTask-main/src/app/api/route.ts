import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import { memory } from "@/lib/memory";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { message, resetMemory } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

  
    if (resetMemory) {
      memory.clear();
    }

   
    memory.add({
      type: "user",
      content: message,
    });

  
    const result = await runAgent(message, req.signal);

    return NextResponse.json({
      success: true,
      result,
      memory: memory.getContext(),
    });

  } catch (err: any) {
    
    if (err?.name === "AbortError") {
      memory.add({
        type: "abort",
        content: "User aborted the request",
      });

      return NextResponse.json(
        {
          success: false,
          aborted: true,
          memory: memory.getContext(),
        },
        { status: 499 }
      );
    }

    console.error("Agent Route Error:", err);

    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
