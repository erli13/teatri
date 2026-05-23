import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "../_components/AdminNav";
import { ShowRowActions } from "./_components/ShowRowActions";
import { CreateShowForm } from "./_components/CreateShowForm";

export const dynamic = "force-dynamic";

export default async function AdminShowsPage() {
  const [shows, venues] = await Promise.all([
    prisma.show.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        venue: { select: { name: true } },
        _count: { select: { tickets: true } },
      },
    }),
    prisma.venue.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <AdminNav />
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shows</h1>
        </div>

        <section className="mb-8 rounded border border-gray-300 p-4">
          <h2 className="mb-3 font-semibold">Create new show</h2>
          {venues.length === 0 ? (
            <p className="text-sm text-gray-800">
              No venues exist yet. (Run the seed script.)
            </p>
          ) : (
            <CreateShowForm venues={venues} />
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold">All shows</h2>
          {shows.length === 0 ? (
            <p className="text-sm text-gray-800">No shows yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Starts</th>
                  <th className="py-2">Venue</th>
                  <th className="py-2">Tickets</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((show) => (
                  <tr key={show.id} className="border-b border-gray-100">
                    <td className="py-2">
                      <Link
                        href={`/admin/shows/${show.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {show.title}
                      </Link>
                    </td>
                    <td className="py-2 text-black">
                      {new Date(show.startsAt).toLocaleString()}
                    </td>
                    <td className="py-2 text-black">{show.venue.name}</td>
                    <td className="py-2 text-black">
                      {show._count.tickets}
                    </td>
                    <td className="py-2">
                      {show.published ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          published
                        </span>
                      ) : (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-black">
                          draft
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <ShowRowActions
                        showId={show.id}
                        published={show.published}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
