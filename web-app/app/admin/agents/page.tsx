import { prisma } from "@/lib/prisma";
import { AdminNav } from "../_components/AdminNav";
import { CreateAgentForm } from "./_components/CreateAgentForm";
import { AgentActiveToggle } from "./_components/AgentActiveToggle";

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const agents = await prisma.user.findMany({
    where: { role: "STAFF" },
    orderBy: { createdAt: "asc" },
    include: {
      tickets: {
        where: { status: { in: ["PAID", "USED"] } },
        select: { price: true, status: true },
      },
    },
  });

  return (
    <main className="min-h-screen bg-white">
      <AdminNav />
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-2xl font-bold">Agents</h1>

        <section className="mb-8 rounded border border-gray-300 p-4">
          <h2 className="mb-3 font-semibold">Create agent</h2>
          <CreateAgentForm />
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Staff accounts</h2>
          {agents.length === 0 ? (
            <p className="text-sm text-gray-800">No agents yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-300 text-left text-xs uppercase text-gray-800">
                <tr>
                  <th className="py-2">ID</th>
                  <th className="py-2">Name / Email</th>
                  <th className="py-2 text-right">Tickets sold</th>
                  <th className="py-2 text-right">Cash held</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const sold = agent.tickets.length;
                  const cash = agent.tickets.reduce(
                    (s, t) => s + Number(t.price),
                    0
                  );
                  return (
                    <tr key={agent.id} className="border-b border-gray-100">
                      <td className="py-2 font-mono text-xs">{agent.id}</td>
                      <td className="py-2">
                        <div>{agent.name ?? "—"}</div>
                        <div className="text-xs text-gray-800">
                          {agent.email}
                        </div>
                      </td>
                      <td className="py-2 text-right">{sold}</td>
                      <td className="py-2 text-right">
                        {cash.toLocaleString()} ALL
                      </td>
                      <td className="py-2">
                        {agent.active ? (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            active
                          </span>
                        ) : (
                          <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-black">
                            inactive
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <AgentActiveToggle
                          userId={agent.id}
                          active={agent.active}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
