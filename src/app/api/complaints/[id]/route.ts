// src/app/api/complaints/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status:   z.string().optional(),
  priority: z.string().optional(),
  assignedToId: z.string().optional(),
  adminNotes: z.string().optional(),
});

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, neighborhood: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  if (!complaint) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin && complaint.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: complaint });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

  const existing = await prisma.complaint.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: "complaint.updated",
      entityType: "Complaint",
      entityId: id,
      actorId: session.user.id,
      before: { status: existing.status, priority: existing.priority },
      after: parsed.data,
    },
  });

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      ...parsed.data,
      status: parsed.data.status as never,
      priority: parsed.data.priority as never,
      ...(parsed.data.status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (!isAdmin && complaint.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.complaint.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Deleted" });
}
