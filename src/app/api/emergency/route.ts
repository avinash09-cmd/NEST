// src/app/api/emergency/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emergencySchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const type   = searchParams.get("type")   ?? undefined;
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

  const where = {
    ...(status ? { status: status as never } : {}),
    ...(type   ? { type:   type   as never } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.emergency.count({ where }),
    prisma.emergency.findMany({
      where, orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * 10, take: 10,
      include: { reportedBy: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return NextResponse.json({ success: true, data, total, page, totalPages: Math.ceil(total / 10) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = emergencySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

  const emergency = await prisma.emergency.create({
    data: {
      ...parsed.data,
      type: parsed.data.type as never,
      severity: parsed.data.severity as never,
      reportedById: session.user.id,
    },
    include: { reportedBy: { select: { id: true, name: true, email: true } } },
  });

  // Auto-create an alert for CRITICAL/HIGH emergencies
  if (["CRITICAL","HIGH"].includes(parsed.data.severity)) {
    await prisma.alert.create({
      data: {
        title: `⚠️ Emergency: ${parsed.data.title}`,
        message: `An emergency has been reported at ${parsed.data.location}. ${parsed.data.description}`,
        type: "GENERAL",
        status: "ACTIVE",
        priority: parsed.data.severity as never,
        createdById: session.user.id,
      },
    });
  }

  return NextResponse.json({ success: true, data: emergency }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  const updated = await prisma.emergency.update({
    where: { id },
    data: {
      status: status as never,
      ...(status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
    },
  });
  return NextResponse.json({ success: true, data: updated });
}
