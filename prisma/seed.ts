// prisma/seed.ts
import {
  PrismaClient, Role, ComplaintCategory, ComplaintStatus,
  Priority, AlertType, AlertStatus, EmergencyType,
  EmergencyStatus, WaterQualityStatus, SentimentLabel,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where:  { email: "admin@nest.gov" },
    update: {},
    create: {
      name: "Admin Officer", email: "admin@nest.gov",
      password: adminPassword, role: Role.ADMIN,
      phone: "+1-555-0100", neighborhood: "Central",
    },
  });

  const residentPassword = await bcrypt.hash("Resident@123", 12);
  const resident = await prisma.user.upsert({
    where:  { email: "resident@nest.gov" },
    update: {},
    create: {
      name: "Jane Resident", email: "resident@nest.gov",
      password: residentPassword, role: Role.RESIDENT,
      phone: "+1-555-0101", address: "42 Maple Street", neighborhood: "North Side",
    },
  });

  const base = Date.now().toString(36).toUpperCase();
  await prisma.complaint.createMany({
    skipDuplicates: true,
    data: [
      {
        ticketNumber: `NEST-2024-${base}A`,
        title: "Large pothole on Oak Avenue",
        description: "There is a dangerous pothole near the intersection of Oak Ave and 3rd St. Several vehicles have been damaged over the past week.",
        category: ComplaintCategory.ROAD_DAMAGE, status: ComplaintStatus.IN_PROGRESS,
        priority: Priority.HIGH, location: "Oak Avenue & 3rd Street",
        userId: resident.id, aiCategory: "ROAD_DAMAGE", aiCategoryConf: 0.97,
        sentimentLabel: SentimentLabel.NEGATIVE, sentimentScore: -0.72, riskScore: 78,
      },
      {
        ticketNumber: `NEST-2024-${base}B`,
        title: "Broken street light on Elm Road",
        description: "The street light at 220 Elm Road has been out for three weeks. The area is very dark and unsafe at night for pedestrians.",
        category: ComplaintCategory.STREET_LIGHTING, status: ComplaintStatus.PENDING,
        priority: Priority.MEDIUM, location: "220 Elm Road",
        userId: resident.id, sentimentLabel: SentimentLabel.NEGATIVE,
        sentimentScore: -0.55, riskScore: 52,
      },
      {
        ticketNumber: `NEST-2024-${base}C`,
        title: "Garbage not collected this week",
        description: "The garbage collection truck did not come on Tuesday. Bins are overflowing and attracting pests.",
        category: ComplaintCategory.GARBAGE_COLLECTION, status: ComplaintStatus.RESOLVED,
        priority: Priority.LOW, location: "North Side Residential Zone",
        userId: resident.id, resolvedAt: new Date(),
        sentimentLabel: SentimentLabel.NEGATIVE, sentimentScore: -0.40, riskScore: 28,
      },
    ],
  });

  await prisma.alert.create({
    data: {
      title: "Water Main Maintenance — Sunday 2AM–6AM",
      message: "Scheduled maintenance on the main water pipeline will cause a temporary water supply interruption in the North Side zone between 2AM and 6AM on Sunday. Please store sufficient water beforehand.",
      type: AlertType.WATER_SUPPLY, status: AlertStatus.ACTIVE,
      priority: Priority.MEDIUM, neighborhood: "North Side",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: admin.id,
    },
  });

  await prisma.emergency.create({
    data: {
      title: "Gas leak reported near community center",
      description: "Residents reported a gas smell near the Oak Street Community Center. Area has been cordoned off pending utility inspection.",
      type: EmergencyType.INFRASTRUCTURE, status: EmergencyStatus.ACTIVE,
      severity: Priority.CRITICAL, location: "Oak Street Community Center",
      contactName: "Fire Chief Robinson", contactPhone: "+1-555-9111",
      reportedById: admin.id,
    },
  });

  await prisma.waterQualityReading.createMany({
    data: [
      { location: "North Reservoir",       zone: "Zone A", status: WaterQualityStatus.SAFE,    ph: 7.2, turbidity: 0.4, chlorine: 0.8, tds: 180, temperature: 18.5, dissolvedO2: 7.2, conductivity: 285, hardness: 95,  nitrates: 3.2, bacteria: false, collectedBy: "Sensor-A1" },
      { location: "South Treatment Plant", zone: "Zone B", status: WaterQualityStatus.CAUTION,  ph: 6.8, turbidity: 2.1, chlorine: 0.3, tds: 340, temperature: 20.1, dissolvedO2: 6.8, conductivity: 410, hardness: 140, nitrates: 8.7, bacteria: false, collectedBy: "Sensor-B2", notes: "Turbidity elevated after recent rainfall." },
      { location: "East Distribution",     zone: "Zone C", status: WaterQualityStatus.SAFE,    ph: 7.4, turbidity: 0.3, chlorine: 1.1, tds: 165, temperature: 17.8, dissolvedO2: 7.5, conductivity: 260, hardness: 88,  nitrates: 2.1, bacteria: false, collectedBy: "Sensor-C3" },
      { location: "West Pump Station",     zone: "Zone D", status: WaterQualityStatus.UNSAFE,  ph: 6.1, turbidity: 4.8, chlorine: 0.1, tds: 620, temperature: 22.3, dissolvedO2: 5.1, conductivity: 780, hardness: 210, nitrates: 18.4,bacteria: false, collectedBy: "Sensor-D4", notes: "High TDS and low chlorine detected. Retesting scheduled." },
    ],
  });

  await prisma.suggestion.createMany({
    data: [
      { title: "Add more park benches in Riverside Park", content: "The park is heavily used by elderly residents but there are very few benches. More seating would greatly improve accessibility.", category: "Park Improvement", sentimentLabel: SentimentLabel.POSITIVE, sentimentScore: 0.65 },
      { title: "Install speed bumps on Cedar Lane",       content: "Cars consistently speed through Cedar Lane near the school. Speed bumps or a traffic camera would improve child safety.", category: "Road Safety", sentimentLabel: SentimentLabel.NEUTRAL, sentimentScore: -0.1 },
    ],
  });

  console.log("Seeding complete.");
  console.log("  Admin:    admin@nest.gov    / Admin@123");
  console.log("  Resident: resident@nest.gov / Resident@123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
