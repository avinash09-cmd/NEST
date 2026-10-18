// src/app/api/suggestions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { suggestionSchema } from "@/lib/validations";
import { hashIP } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const isReviewed = searchParams.get("reviewed");
  const where = isReviewed === "true" ? { isReviewed: true } : isReviewed === "false" ? { isReviewed: false } : {};

  const [total, data] = await Promise.all([
    prisma.suggestion.count({ where }),
    prisma.suggestion.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * 10, take: 10,
    }),
  ]);

  return NextResponse.json({ success: true, data, total, page, totalPages: Math.ceil(total / 10) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = suggestionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

  // Rate-limit by hashed IP: max 5 suggestions per hour
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const ipHash = hashIP(ip);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.suggestion.count({ where: { ipHash, createdAt: { gte: oneHourAgo } } });
  if (recentCount >= 5) return NextResponse.json({ success: false, error: "Too many suggestions. Please try again later." }, { status: 429 });

  const suggestion = await prisma.suggestion.create({
    data: { ...parsed.data, ipHash },
  });

  // Fire-and-forget sentiment analysis
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/sentiment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityId: suggestion.id, entityType: "suggestion", text: `${parsed.data.title}. ${parsed.data.content}` }),
  }).catch(() => {});

  return NextResponse.json({ success: true, data: { id: suggestion.id }, message: "Thank you for your suggestion!" }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id, isReviewed, adminNotes } = await req.json();
  if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

  const updated = await prisma.suggestion.update({
    where: { id },
    data: { isReviewed, adminNotes },
  });
  return NextResponse.json({ success: true, data: updated });
}
