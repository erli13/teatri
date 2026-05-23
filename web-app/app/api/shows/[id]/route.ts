import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      venue: { select: { id: true, name: true } },
      prices: {
        include: {
          zone: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  return NextResponse.json(show);
}
