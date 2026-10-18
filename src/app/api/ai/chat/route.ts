// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are N.E.S.T. Assistant, an AI helper embedded in the Neighborhood Emergency and Safety Tool platform.

Your role:
- Help residents file and track complaints about neighborhood issues
- Explain how to use the N.E.S.T. platform
- Provide guidance on neighborhood safety and emergency preparedness
- Answer questions about water quality, alerts, and local services
- Direct users to the correct section of the app

Platform sections:
- Dashboard: Overview of all activity
- Complaints: File and track neighborhood issue reports (road damage, lighting, garbage, etc.)
- Suggestions: Submit anonymous improvement ideas
- Alerts: View neighborhood-wide alerts and notifications
- Emergency: Report and track emergency incidents
- Water Quality: View real-time water safety data by zone

Guidelines:
- Be concise, helpful, and empathetic
- If someone describes an emergency, urge them to call 911 AND use the Emergency section
- For water safety concerns, direct them to the Water Quality page
- Never fabricate specific complaint status or ticket numbers
- Keep responses under 200 words unless a detailed explanation is genuinely needed`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { message, sessionId, history = [] } = await req.json();
  if (!message?.trim()) return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });

  const sid = sessionId ?? `chat_${Date.now()}`;

  // Save user message
  await prisma.chatMessage.create({
    data: { role: "user", content: message, userId: session.user.id, sessionId: sid },
  });

  try {
    const messages = [
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const assistantMessage = response.content[0].type === "text" ? response.content[0].text : "";

    // Save assistant message
    await prisma.chatMessage.create({
      data: { role: "assistant", content: assistantMessage, userId: session.user.id, sessionId: sid },
    });

    return NextResponse.json({
      success: true,
      data: { message: assistantMessage, sessionId: sid },
    });
  } catch (error) {
    console.error("[AI_CHAT]", error);
    return NextResponse.json({ success: false, error: "Chat failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get("sessionId");

  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id, ...(sessionId ? { sessionId } : {}) },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json({ success: true, data: messages });
}
