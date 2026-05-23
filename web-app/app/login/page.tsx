import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const session = await getSession();
  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/agent");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="w-full max-w-sm rounded border border-gray-300 p-6">
        <h1 className="mb-4 text-xl font-bold">Sign in</h1>
        {error === "forbidden" && (
          <p className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">
            You don&apos;t have access to that page.
          </p>
        )}
        {error === "invalid" && (
          <p className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Invalid email or password.
          </p>
        )}
        {error === "inactive" && (
          <p className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Your account is deactivated. Contact an admin.
          </p>
        )}
        <LoginForm next={next ?? null} />
      </div>
    </main>
  );
}
