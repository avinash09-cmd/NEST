// src/app/api/ai/risk-score/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { complaintId } = await req.json();
    if (!complaintId) return NextResponse.json({ success: false, error: "Missing complaintId" }, { status: 400 });

    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `You are a civic risk assessment AI. Score this neighborhood complaint.

Title: ${complaint.title}
Category: ${complaint.category}
Description: ${complaint.description}
Location: ${complaint.location}
Sentiment: ${complaint.sentimentLabel ?? "UNKNOWN"} (score: ${complaint.sentimentScore ?? 0})
AI Category: ${complaint.aiCategory ?? complaint.category}

Factors to consider: public safety risk, infrastructure damage, health hazard, number of residents affected, urgency.

Respond in JSON only (no markdown):
{
  "riskScore": <0-100>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "reasoning": "<brief one-sentence explanation>"
}`,
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    await prisma.complaint.update({
      where: { id: complaintId },
      data: { riskScore: parsed.riskScore },
    });

    // Auto-escalate priority for critical risk
    if (parsed.riskLevel === "CRITICAL" && complaint.priority !== "CRITICAL") {
      await prisma.complaint.update({
        where: { id: complaintId },
        data: { priority: "CRITICAL" },
      });
    } else if (parsed.riskLevel === "HIGH" && !["HIGH","CRITICAL"].includes(complaint.priority)) {
      await prisma.complaint.update({
        where: { id: complaintId },
        data: { priority: "HIGH" },
      });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[AI_RISK_SCORE]", error);
    return NextResponse.json({ success: false, error: "Risk scoring failed" }, { status: 500 });
  }
}
