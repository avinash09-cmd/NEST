// src/app/api/ai/sentiment/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { entityId, entityType, text } = await req.json();
    if (!entityId || !entityType || !text) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Analyze the sentiment of this civic complaint/suggestion text.

Text: "${text}"

Respond in JSON only (no markdown):
{
  "label": "<POSITIVE|NEUTRAL|NEGATIVE|VERY_NEGATIVE>",
  "score": <-1.0 to 1.0>,
  "urgency": "<LOW|MEDIUM|HIGH|CRITICAL>"
}`,
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Update the appropriate entity
    if (entityType === "complaint") {
      await prisma.complaint.update({
        where: { id: entityId },
        data: {
          sentimentLabel: parsed.label as never,
          sentimentScore: parsed.score,
        },
      });

      // Fire risk scoring after sentiment
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/risk-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId: entityId }),
      }).catch(() => {});
    } else if (entityType === "suggestion") {
      await prisma.suggestion.update({
        where: { id: entityId },
        data: {
          sentimentLabel: parsed.label as never,
          sentimentScore: parsed.score,
        },
      });
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[AI_SENTIMENT]", error);
    return NextResponse.json({ success: false, error: "Sentiment analysis failed" }, { status: 500 });
  }
}
