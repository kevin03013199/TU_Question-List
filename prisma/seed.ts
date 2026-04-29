import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const departments = [
    { code: "OP", name: "生產 OP", nameEn: "Operations" },
    { code: "PE", name: "製程工程 PE", nameEn: "Process Engineering" },
    { code: "PC", name: "生管 PC", nameEn: "Production Control" },
    { code: "SALES", name: "業務", nameEn: "Sales" },
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, nameEn: d.nameEn, active: true },
      create: { code: d.code, name: d.name, nameEn: d.nameEn },
    });
  }

  const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash: hash,
      displayName: "管理員",
      role: "ADMIN",
      active: true,
    },
  });

  await prisma.setting.upsert({
    where: { key: "refreshIntervalSeconds" },
    update: {},
    create: { key: "refreshIntervalSeconds", value: "5" },
  });

  console.log(`Seeded. Admin login: ${adminUsername} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
