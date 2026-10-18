// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name:         z.string().min(2).max(100),
  phone:        z.string().optional(),
  address:      z.string().optional(),
  neighborhood: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, address: true, neighborhood: true, role: true, createdAt: true },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data:  parsed.data,
    select: { id: true, name: true, email: true, phone: true, address: true, neighborhood: true, role: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
