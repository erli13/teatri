import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/auth";

type BookingPayload = {
  seatIds: string[];
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "STAFF" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const agentId = session.userId;

  const { id: showId } = await params;

  let body: BookingPayload;
  try {
    body = (await req.json()) as BookingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { seatIds } = body;

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return NextResponse.json(
      { error: "seatIds must be a non-empty array" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 0. Show must be published, agent must exist and be active.
      const show = await tx.show.findUnique({
        where: { id: showId },
        select: { published: true },
      });
      if (!show) throw new Error("Show not found");
      if (!show.published) throw new Error("Show is not published");
      const agent = await tx.user.findUnique({
        where: { id: agentId },
        select: { active: true, role: true },
      });
      if (!agent) throw new Error("Agent not found");
      if (!agent.active) throw new Error("Agent is inactive");

      // 1. Lock the requested seat rows for the duration of the transaction.
      await tx.$queryRaw`
        SELECT id FROM "Seat"
        WHERE id IN (${Prisma.join(seatIds)})
        FOR UPDATE
      `;

      // 2. Double-booking check: any active ticket for these seats on this show?
      const existing = await tx.ticket.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
          status: { in: ["RESERVED", "PAID", "USED"] },
        },
        select: { seatId: true },
      });
      if (existing.length > 0) {
        throw new Error("Seats already taken");
      }

      // 3. Load the seats (to get zone assignments) and the show prices.
      const seats = await tx.seat.findMany({
        where: { id: { in: seatIds } },
        select: { id: true, zoneId: true },
      });
      if (seats.length !== seatIds.length) {
        throw new Error("One or more seats do not exist");
      }

      const zoneIds = Array.from(new Set(seats.map((s) => s.zoneId)));
      const prices = await tx.showPrice.findMany({
        where: { showId, zoneId: { in: zoneIds } },
      });
      const priceByZone = new Map(prices.map((p) => [p.zoneId, p]));

      for (const zoneId of zoneIds) {
        if (!priceByZone.has(zoneId)) {
          throw new Error(`No price configured for zone ${zoneId}`);
        }
      }

      // 4. Create tickets, one per seat, with a generated qr_hash (stored in `code`).
      const ticketInputs = seats.map((seat) => {
        const price = priceByZone.get(seat.zoneId)!;
        return {
          showId,
          seatId: seat.id,
          userId: agentId,
          price: price.price,
          currency: price.currency,
          status: "PAID" as const,
          code: randomUUID(),
        };
      });

      const created = await Promise.all(
        ticketInputs.map((data) => tx.ticket.create({ data }))
      );

      const totalPrice = created.reduce(
        (sum, t) => sum + Number(t.price),
        0
      );

      return {
        tickets: created,
        totalPrice,
        currency: created[0]?.currency ?? "ALL",
        qrHashes: created.map((t) => t.code),
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed";
    if (message === "Seats already taken") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
