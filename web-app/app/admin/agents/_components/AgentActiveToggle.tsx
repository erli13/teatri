"use client";

import { useTransition } from "react";
import { toggleAgentActive } from "../../actions";

export function AgentActiveToggle({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => toggleAgentActive(userId, !active))}
      disabled={pending}
      className="rounded border border-gray-400 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
    >
      {pending ? "..." : active ? "Deactivate" : "Activate"}
    </button>
  );
}
