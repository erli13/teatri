import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "../../_components/AdminNav";
import { EditShowForm } from "./_components/EditShowForm";
import { PricesEditor } from "./_components/PricesEditor";
import { SeatReservationGrid } from "./_components/SeatReservationGrid";
import { ShowRowActions } from "../_components/ShowRowActions";

export const dynamic = "force-dynamic";

export default async function AdminShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: showId } = await params;

  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: {
      venue: {
        include: {
          seatingZones: {
            include: {
              seats: {
                orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
              },
            },
          },
        },
      },
      prices: { include: { zone: true } },
    },
  });
  if (!show) notFound();

  // Tickets that should block reservation: RESERVED / PAID / USED.
  const activeTickets = await prisma.ticket.findMany({
    where: {
      showId,
      status: { in: ["RESERVED", "PAID", "USED"] },
    },
    select: { id: true, seatId: true, status: true, userId: true },
  });
  const ticketsBySeat = new Map(activeTickets.map((t) => [t.seatId, t]));

  const priceByZone = new Map(show.prices.map((p) => [p.zoneId, p]));

  return (
    <main className="min-h-screen bg-white">
      <AdminNav />
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{show.title}</h1>
            <p className="text-sm text-gray-800">
              {new Date(show.startsAt).toLocaleString()} · {show.venue.name} ·{" "}
              {show.published ? "published" : "draft"}
            </p>
          </div>
          <ShowRowActions showId={show.id} published={show.published} />
        </div>

        <section className="mb-8 rounded border border-gray-300 p-4">
          <h2 className="mb-3 font-semibold">Edit show</h2>
          <EditShowForm
            showId={show.id}
            defaults={{
              title: show.title,
              description: show.description ?? "",
              startsAt: toLocalInput(show.startsAt),
              endsAt: show.endsAt ? toLocalInput(show.endsAt) : "",
            }}
          />
        </section>

        <section className="mb-8 rounded border border-gray-300 p-4">
          <h2 className="mb-3 font-semibold">Zone pricing</h2>
          <PricesEditor
            showId={show.id}
            zones={show.venue.seatingZones.map((z) => ({
              id: z.id,
              name: z.name,
              currentPrice: priceByZone.get(z.id)?.price.toString() ?? "",
              currency: priceByZone.get(z.id)?.currency ?? "ALL",
            }))}
          />
        </section>

        <section className="rounded border border-gray-300 p-4">
          <h2 className="mb-1 font-semibold">Reserve seats</h2>
          <p className="mb-3 text-xs text-gray-800">
            Click free seats to select them, then reserve. Reserved seats appear
            as taken on the agent POS. Sold/used seats are read-only here.
          </p>
          {show.venue.seatingZones.some(
            (z) => !priceByZone.has(z.id)
          ) ? (
            <p className="text-sm text-amber-700">
              Set a price for every zone before reserving seats.
            </p>
          ) : (
            <SeatReservationGrid
              showId={show.id}
              zones={show.venue.seatingZones.map((z) => ({
                id: z.id,
                name: z.name,
                seats: z.seats.map((s) => {
                  const t = ticketsBySeat.get(s.id);
                  return {
                    id: s.id,
                    rowLabel: s.rowLabel,
                    seatNumber: s.seatNumber,
                    ticketStatus: t?.status ?? null,
                    ticketId: t?.id ?? null,
                    // Reservations created by the system user can be released.
                    releasable:
                      t?.status === "RESERVED" && t.userId === "system-admin",
                  };
                }),
              }))}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function toLocalInput(d: Date): string {
  const dt = new Date(d);
  const tz = dt.getTimezoneOffset() * 60_000;
  return new Date(dt.getTime() - tz).toISOString().slice(0, 16);
}
