import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const shows = await prisma.show.findMany({
    where: { published: true },
    orderBy: { startsAt: "asc" },
    include: {
      venue: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(shows);
}
