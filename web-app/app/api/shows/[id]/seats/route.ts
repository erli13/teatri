import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: showId } = await params;

  const show = await prisma.show.findUnique({
    where: { id: showId },
    select: { id: true, venueId: true },
  });

  if (!show) {
    return NextResponse.json({ error: "Show not found" }, { status: 404 });
  }

  const [zones, takenTickets] = await Promise.all([
    prisma.seatingZone.findMany({
      where: { venueId: show.venueId },
      include: {
        seats: {
          orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
        },
      },
    }),
    prisma.ticket.findMany({
      where: {
        showId,
        status: { in: ["RESERVED", "PAID", "USED"] },
      },
      select: { seatId: true },
    }),
  ]);

  const takenSeatIds = new Set(takenTickets.map((t) => t.seatId));

  const layout = zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    description: zone.description,
    seats: zone.seats.map((seat) => ({
      id: seat.id,
      rowLabel: seat.rowLabel,
      seatNumber: seat.seatNumber,
      isTaken: takenSeatIds.has(seat.id),
    })),
  }));

  return NextResponse.json({ showId, zones: layout });
}
