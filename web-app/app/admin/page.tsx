import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "./_components/AdminNav";
import { BypassQRButton } from "./_components/BypassQRButton";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [paidTickets, showCount, publishedCount, agentCount] =
    await Promise.all([
      prisma.ticket.findMany({
        where: { status: "PAID" },
        select: { price: true, userId: true },
      }),
      prisma.show.count(),
      prisma.show.count({ where: { published: true } }),
      prisma.user.count({ where: { role: "STAFF" } }),
    ]);

  const revenue = paidTickets.reduce((s, t) => s + Number(t.price), 0);

  return (
    <main className="min-h-screen bg-white">
      <AdminNav />
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <BypassQRButton />
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="Revenue (PAID)" value={`${revenue.toLocaleString()} ALL`} />
          <Metric label="Tickets sold" value={paidTickets.length} />
          <Metric
            label="Shows"
            value={`${publishedCount}/${showCount} published`}
          />
          <Metric label="Staff agents" value={agentCount} />
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NavCard
            href="/admin/shows"
            title="Manage Shows"
            blurb="Create, edit, publish, and delete shows. Set zone prices. Reserve seats before going live."
          />
          <NavCard
            href="/admin/agents"
            title="Manage Agents"
            blurb="View staff agents, see how much each is holding, activate or deactivate accounts."
          />
          <NavCard
            href="/agent"
            title="Open Agent POS →"
            blurb="Jump into the POS as a staff agent (for testing)."
          />
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-gray-300 p-3">
      <p className="text-xs uppercase text-gray-800">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function NavCard({
  href,
  title,
  blurb,
}: {
  href: string;
  title: string;
  blurb: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded border border-gray-300 p-4 hover:bg-gray-50"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-gray-800">{blurb}</p>
    </Link>
  );
}
