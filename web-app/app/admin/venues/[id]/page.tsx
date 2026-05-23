import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "../../_components/AdminNav";
import { ZoneSection } from "./_components/ZoneSection";
import { CreateZoneForm } from "./_components/CreateZoneForm";

export const dynamic = "force-dynamic";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: venueId } = await params;

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      seatingZones: {
        orderBy: { createdAt: "asc" },
        include: {
          seats: {
            orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
          },
          _count: { select: { seats: true } },
        },
      },
    },
  });
  if (!venue) notFound();

  return (
    <main className="min-h-screen bg-white">
      <AdminNav />
      <div className="mx-auto max-w-5xl p-6">
        <p className="mb-1 text-xs text-black">
          <a href="/admin/venues" className="text-blue-600 hover:underline">
            ← All venues
          </a>
        </p>
        <h1 className="mb-1 text-2xl font-bold">{venue.name}</h1>
        <p className="mb-6 text-sm text-black">
          {venue.city ?? "—"} · {venue.seatingZones.length} zones
        </p>

        <section className="mb-6 rounded border border-gray-300 p-4">
          <h2 className="mb-3 font-semibold">
            Add zone (floor / section)
          </h2>
          <p className="mb-2 text-xs text-black">
            Each zone is a separately-priced section. For multiple floors,
            create one zone per floor (e.g. &quot;Ground Floor&quot;,
            &quot;Balcony Floor 1&quot;, &quot;Balcony Floor 2&quot;).
          </p>
          <CreateZoneForm venueId={venue.id} />
        </section>

        <h2 className="mb-3 font-semibold">Zones</h2>
        {venue.seatingZones.length === 0 ? (
          <p className="text-sm text-black">No zones yet.</p>
        ) : (
          <div className="space-y-4">
            {venue.seatingZones.map((zone) => (
              <ZoneSection
                key={zone.id}
                zone={{
                  id: zone.id,
                  name: zone.name,
                  description: zone.description,
                  seats: zone.seats.map((s) => ({
                    id: s.id,
                    rowLabel: s.rowLabel,
                    seatNumber: s.seatNumber,
                  })),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
