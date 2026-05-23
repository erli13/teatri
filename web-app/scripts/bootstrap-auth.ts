import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const adminPw = await bcrypt.hash("admin123", 10);
  const agentPw = await bcrypt.hash("agent123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@theatre.al" },
    update: { password: adminPw, role: "ADMIN", active: true },
    create: {
      email: "admin@theatre.al",
      name: "Admin",
      password: adminPw,
      role: "ADMIN",
    },
  });

  // Re-hash any existing staff users that still have the "x" placeholder.
  const staffToFix = await prisma.user.findMany({
    where: { role: "STAFF", password: "x" },
  });
  for (const s of staffToFix) {
    await prisma.user.update({
      where: { id: s.id },
      data: { password: agentPw },
    });
  }

  console.log(`Admin: admin@theatre.al / admin123 (id=${admin.id})`);
  console.log(
    `Patched ${staffToFix.length} legacy staff user(s) → password 'agent123'`
  );
  await prisma.$disconnect();
}
main();
