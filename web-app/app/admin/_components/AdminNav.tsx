import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";

export async function AdminNav() {
  const session = await getSession();
  return (
    <nav className="border-b border-gray-300 bg-gray-50">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3 text-sm">
        <Link href="/admin" className="font-semibold">
          Admin
        </Link>
        <Link href="/admin/shows" className="text-black hover:underline">
          Shows
        </Link>
        <Link href="/admin/agents" className="text-black hover:underline">
          Agents
        </Link>
        <Link href="/admin/venues" className="text-black hover:underline">
          Layout
        </Link>
        <span className="ml-auto flex items-center gap-3">
          {session && (
            <span className="text-xs text-black">
              {session.name ?? session.email} · {session.role}
            </span>
          )}
          <Link href="/agent" className="text-blue-600 hover:underline">
            Agent POS →
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-black hover:underline">
              Logout
            </button>
          </form>
        </span>
      </div>
    </nav>
  );
}
