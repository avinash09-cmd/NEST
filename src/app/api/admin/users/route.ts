// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function isAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const search = searchParams.get("search") ?? undefined;
  const role   = searchParams.get("role")   ?? undefined;

  const where = {
    ...(role   ? { role: role as never } : {}),
    ...(search ? { OR: [
      { name:  { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
    ]} : {}),
  };

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 15,
      take: 15,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, phone: true, neighborhood: true, createdAt: true,
        _count: { select: { complaints: true } },
      },
    }),
  ]);

  return NextResponse.json({
    success: true, data, total, page,
    totalPages: Math.ceil(total / 15),
  });
}

const updateSchema = z.object({
  userId:   z.string(),
  role:     z.enum(["RESIDENT", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { userId, role, isActive } = parsed.data;

  if (userId === session.user.id && role === "RESIDENT") {
    return NextResponse.json({ success: false, error: "You cannot demote yourself" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(role     !== undefined ? { role }     : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "user.updated", entityType: "User",
      entityId: userId, actorId: session.user.id,
      after: parsed.data,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
