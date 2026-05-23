"use client";

import { useTransition } from "react";
import { createAgent } from "../../actions";

export function CreateAgentForm() {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) =>
        start(async () => {
          try {
            await createAgent(fd);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Create failed");
          }
        })
      }
      className="flex flex-wrap items-end gap-2"
    >
      <label className="block">
        <span className="block text-xs text-black">Email</span>
        <input
          name="email"
          type="email"
          required
          className="mt-1 rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-black">Name</span>
        <input
          name="name"
          className="mt-1 rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-black">Password (min 6)</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1 rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:bg-gray-400"
      >
        {pending ? "Creating..." : "Create agent"}
      </button>
    </form>
  );
}
