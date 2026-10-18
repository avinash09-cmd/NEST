// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

  const [total, data] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
      include: { alert: { select: { type: true, priority: true } } },
    }),
  ]);

  return NextResponse.json({ success: true, data, total, page, totalPages: Math.ceil(total / 20) });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id, markAll } = await req.json();

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data:  { isRead: true },
    });
    return NextResponse.json({ success: true, message: "All marked as read" });
  }

  if (id) {
    await prisma.notification.update({
      where: { id, userId: session.user.id },
      data:  { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "id or markAll required" }, { status: 400 });
}
