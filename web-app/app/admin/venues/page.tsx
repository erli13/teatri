import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "../_components/AdminNav";
import { CreateVenueForm } from "./_components/CreateVenueForm";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const venues = await prisma.venue.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { shows: true, seatingZones: true } },
    },
  });

  return (
    <main className="min-h-screen bg-white">
      <AdminNav />
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Layout</h1>

        <section className="mb-8 rounded border border-gray-300 p-4">
          <h2 className="mb-3 font-semibold">Create venue</h2>
          <CreateVenueForm />
        </section>

        <section>
          <h2 className="mb-3 font-semibold">All venues</h2>
          {venues.length === 0 ? (
            <p className="text-sm text-black">No venues yet.</p>
          ) : (
            <ul className="space-y-2">
              {venues.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded border border-gray-300 px-4 py-2"
                >
                  <div>
                    <Link
                      href={`/admin/venues/${v.id}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {v.name}
                    </Link>
                    <p className="text-xs text-black">
                      {v.city ?? "—"} · {v._count.seatingZones} zones ·{" "}
                      {v._count.shows} shows
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
