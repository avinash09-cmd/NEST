// src/app/api/complaints/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { complaintSchema } from "@/lib/validations";
import { generateTicketNumber } from "@/lib/utils";
import { PAGINATION_LIMIT } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? String(PAGINATION_LIMIT)));
  const status   = searchParams.get("status")   ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const search   = searchParams.get("search")   ?? undefined;
  const isAdmin  = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const where = {
    ...(isAdmin ? {} : { userId: session.user.id }),
    ...(status   ? { status:   status   as never } : {}),
    ...(category ? { category: category as never } : {}),
    ...(priority ? { priority: priority as never } : {}),
    ...(search   ? { OR: [
      { title:       { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
      { ticketNumber:{ contains: search, mode: "insensitive" as const } },
    ]} : {}),
  };

  const [total, data] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = complaintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { title, description, category, location, latitude, longitude, isAnonymous, attachments } = parsed.data;

  const complaint = await prisma.complaint.create({
    data: {
      ticketNumber: generateTicketNumber(),
      title,
      description,
      category: category as never,
      location,
      latitude,
      longitude,
      isAnonymous,
      attachments: attachments ?? [],
      userId: session.user.id,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  // Fire-and-forget AI classification
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ai/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ complaintId: complaint.id, title, description }),
  }).catch(() => {});

  return NextResponse.json({ success: true, data: complaint }, { status: 201 });
}
