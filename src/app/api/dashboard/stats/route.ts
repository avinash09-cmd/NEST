// src/app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  const [
    totalComplaints, pendingComplaints, resolvedComplaints,
    activeAlerts, activeEmergencies,
    waterReadings, unreadNotifications,
    recentComplaints,
  ] = await Promise.all([
    prisma.complaint.count({ where: isAdmin ? {} : { userId } }),
    prisma.complaint.count({ where: { status: "PENDING", ...(isAdmin ? {} : { userId }) } }),
    prisma.complaint.count({ where: { status: "RESOLVED", ...(isAdmin ? {} : { userId }) } }),
    prisma.alert.count({ where: { status: "ACTIVE" } }),
    prisma.emergency.count({ where: { status: { in: ["REPORTED", "DISPATCHED", "ACTIVE"] } } }),
    prisma.waterQualityReading.findMany({ orderBy: { recordedAt: "desc" }, take: 50, select: { status: true } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.complaint.findMany({
      where: isAdmin ? {} : { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, ticketNumber: true, title: true, status: true,
        priority: true, category: true, createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const waterSafeZones = waterReadings.filter((r) => r.status === "SAFE").length;
  const waterUnsafeZones = waterReadings.filter((r) => r.status === "UNSAFE" || r.status === "CRITICAL").length;

  return NextResponse.json({
    success: true,
    data: {
      totalComplaints, pendingComplaints, resolvedComplaints,
      activeAlerts, activeEmergencies,
      waterSafeZones, waterUnsafeZones,
      unreadNotifications,
      recentComplaints,
    },
  });
}
