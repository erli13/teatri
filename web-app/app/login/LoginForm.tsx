"use client";

import { useTransition } from "react";
import { loginAction } from "./actions";

export function LoginForm({ next }: { next: string | null }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => loginAction(fd, next))}
      className="space-y-3"
    >
      <label className="block">
        <span className="block text-xs text-black">Email</span>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-black">Password</span>
        <input
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-black px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-400"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
