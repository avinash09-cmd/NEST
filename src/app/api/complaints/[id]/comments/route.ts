// src/app/api/complaints/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  isInternal: z.boolean().default(false),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  // Non-admins cannot post internal notes
  const isInternal = isAdmin ? parsed.data.isInternal : false;

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (!complaint) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (!isAdmin && complaint.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.complaintComment.create({
    data: { content: parsed.data.content, isInternal, complaintId: id, userId: session.user.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  return NextResponse.json({ success: true, data: comment }, { status: 201 });
}
