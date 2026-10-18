// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalComplaints, totalSuggestions, totalAlerts, totalEmergencies, auditLogs] = await Promise.all([
    prisma.user.count(),
    prisma.complaint.count(),
    prisma.suggestion.count(),
    prisma.alert.count({ where: { status: "ACTIVE" } }),
    prisma.emergency.count({ where: { status: { in: ["REPORTED", "DISPATCHED", "ACTIVE"] } } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return NextResponse.json({
    success: true,
    data: { totalUsers, totalComplaints, totalSuggestions, totalAlerts, totalEmergencies, auditLogs },
  });
}
