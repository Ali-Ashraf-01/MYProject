import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/memory";
import { runAgent } from "@/lib/agent";


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

    // 🧹 Reset memory if requested
    if (resetMemory) {
      memory.clear();
    }

    // 🧠 سجل رسالة المستخدم
    memory.add({
      type: "user",
      content: message,
    });

    // 🚀 شغّل الـ Agent مع abortSignal
    const result = await runAgent(message, req.signal);

    return NextResponse.json({
      success: true,
      result: result.output, // أرجع بس الـ output مش كل الـ result
    });

  } catch (err: any) {
    // 🛑 لو اليوزر وقف الريكوست
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
