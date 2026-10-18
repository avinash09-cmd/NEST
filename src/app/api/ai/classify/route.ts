// src/app/api/ai/classify/route.ts
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { complaintId, title, description } = await req.json();
    if (!complaintId || !title || !description) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const categories = [
      "ROAD_DAMAGE","STREET_LIGHTING","GARBAGE_COLLECTION","WATER_SUPPLY",
      "SEWAGE_DRAINAGE","NOISE_POLLUTION","PUBLIC_SAFETY","PARK_MAINTENANCE",
      "ILLEGAL_DUMPING","BUILDING_HAZARD","ANIMAL_CONTROL","OTHER",
    ];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are a civic complaint classifier. Classify this complaint into exactly one category.

Complaint Title: ${title}
Complaint Description: ${description}

Categories: ${categories.join(", ")}

Respond in JSON only (no markdown):
{
  "category": "<CATEGORY>",
  "confidence": <0.0-1.0>,
  "summary": "<one sentence AI summary of the complaint>"
}`,
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        aiCategory: parsed.category,
        aiCategoryConf: parsed.confidence,
        aiSummary: parsed.summary,
      },
    });

    // Trigger sentiment analysis after classification
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/sentiment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: complaintId,
        entityType: "complaint",
        text: `${title}. ${description}`,
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("[AI_CLASSIFY]", error);
    return NextResponse.json({ success: false, error: "Classification failed" }, { status: 500 });
  }
}
