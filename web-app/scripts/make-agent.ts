import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const u = await prisma.user.upsert({
    where: { id: "test-agent-1" },
    update: {},
    create: {
      id: "test-agent-1",
      email: "agent1@theatre.al",
      name: "Test Agent 1",
      password: "x",
      role: "STAFF",
    },
  });
  console.log("AGENT_ID=" + u.id);
  await prisma.$disconnect();
}
main();
