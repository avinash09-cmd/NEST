// src/app/api/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { alertSchema } from "@/lib/validations";

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
    prisma.alert.count({ where }),
    prisma.alert.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * 10, take: 10,
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return NextResponse.json({ success: true, data, total, page, totalPages: Math.ceil(total / 10) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = alertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

  const alert = await prisma.alert.create({
    data: {
      ...parsed.data,
      type: parsed.data.type as never,
      priority: parsed.data.priority as never,
      status: "ACTIVE",
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      createdById: session.user.id,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  // Create notifications for all residents
  const residents = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
  await prisma.notification.createMany({
    data: residents.map(r => ({
      title: parsed.data.title,
      message: parsed.data.message,
      userId: r.id,
      alertId: alert.id,
    })),
  });

  return NextResponse.json({ success: true, data: alert }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ success: false, error: "id and status required" }, { status: 400 });

  const updated = await prisma.alert.update({ where: { id }, data: { status: status as never } });
  return NextResponse.json({ success: true, data: updated });
}
