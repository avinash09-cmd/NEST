// src/app/api/water-quality/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { waterReadingSchema } from "@/lib/validations";
import { WATER_THRESHOLDS } from "@/lib/constants";

function computeStatus(data: {
  ph: number; turbidity: number; chlorine: number; tds: number;
  nitrates?: number | null; bacteria: boolean;
}): "SAFE" | "CAUTION" | "UNSAFE" | "CRITICAL" {
  if (data.bacteria) return "CRITICAL";
  const t = WATER_THRESHOLDS;
  const critical =
    data.ph < 5.5 || data.ph > 9.5 ||
    data.turbidity > 10 ||
    data.chlorine > 10 ||
    data.tds > 1000 ||
    (data.nitrates != null && data.nitrates > 50);
  if (critical) return "CRITICAL";

  const unsafe =
    data.ph < 6.0 || data.ph > 9.0 ||
    data.turbidity > 4 ||
    data.chlorine < 0.1 ||
    data.tds > 700 ||
    (data.nitrates != null && data.nitrates > 25);
  if (unsafe) return "UNSAFE";

  const caution =
    data.ph < t.ph.min || data.ph > t.ph.max ||
    data.turbidity > t.turbidity.max ||
    data.chlorine < t.chlorine.min || data.chlorine > t.chlorine.max ||
    data.tds > t.tds.max ||
    (data.nitrates != null && data.nitrates > t.nitrates.max);
  if (caution) return "CAUTION";

  return "SAFE";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const zone   = searchParams.get("zone")   ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const latest = searchParams.get("latest") === "true";

  const where = {
    ...(zone   ? { zone }              : {}),
    ...(status ? { status: status as never } : {}),
  };

  if (latest) {
    // Return latest reading per zone
    const readings = await prisma.waterQualityReading.findMany({
      where, orderBy: { recordedAt: "desc" }, take: 20,
    });
    return NextResponse.json({ success: true, data: readings });
  }

  const [total, data] = await Promise.all([
    prisma.waterQualityReading.count({ where }),
    prisma.waterQualityReading.findMany({
      where, orderBy: { recordedAt: "desc" },
      skip: (page - 1) * 20, take: 20,
    }),
  ]);

  return NextResponse.json({ success: true, data, total, page, totalPages: Math.ceil(total / 20) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = waterReadingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

  const status = computeStatus(parsed.data);
  const reading = await prisma.waterQualityReading.create({
    data: { ...parsed.data, status },
  });

  // Auto-alert if unsafe
  if (status === "UNSAFE" || status === "CRITICAL") {
    await prisma.alert.create({
      data: {
        title: `Water Quality ${status} — ${parsed.data.zone}`,
        message: `Water quality test in ${parsed.data.location} (${parsed.data.zone}) has been flagged as ${status}. Residents are advised to use bottled water until further notice.`,
        type: "PUBLIC_HEALTH",
        status: "ACTIVE",
        priority: status === "CRITICAL" ? "CRITICAL" : "HIGH",
        neighborhood: parsed.data.zone,
        createdById: session.user.id,
      },
    });
  }

  return NextResponse.json({ success: true, data: reading }, { status: 201 });
}
