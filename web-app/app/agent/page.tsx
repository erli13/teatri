import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function AgentHomePage() {
  const session = await getSession();
  const shows = await prisma.show.findMany({
    where: { published: true },
    orderBy: { startsAt: "asc" },
    include: { venue: { select: { name: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">
            Agent POS — Select a Show
          </h1>
          <div className="flex items-center gap-3 text-sm">
            {session && (
              <span className="text-black">
                {session.name ?? session.email} · {session.role}
              </span>
            )}
            <form action={logoutAction}>
              <button className="rounded border border-gray-400 px-2 py-1 text-xs text-black hover:bg-gray-100">
                Logout
              </button>
            </form>
          </div>
        </div>

        {shows.length === 0 ? (
          <p className="text-slate-800">No upcoming shows.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shows.map((show) => (
              <Link
                key={show.id}
                href={`/agent/shows/${show.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400 hover:shadow-md"
              >
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  {show.title}
                </h2>
                <p className="text-sm text-slate-800">
                  {new Date(show.startsAt).toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {show.venue.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
