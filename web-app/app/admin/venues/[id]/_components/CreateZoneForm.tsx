"use client";

import { useTransition } from "react";
import { createZone } from "../../../actions";

export function CreateZoneForm({ venueId }: { venueId: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) =>
        start(async () => {
          try {
            await createZone(venueId, fd);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Create failed");
          }
        })
      }
      className="flex flex-wrap items-end gap-2"
    >
      <label className="block">
        <span className="block text-xs text-black">Zone name</span>
        <input
          name="name"
          required
          placeholder="Balcony Floor 2"
          className="mt-1 rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block flex-1 min-w-[12rem]">
        <span className="block text-xs text-black">Description</span>
        <input
          name="description"
          placeholder="VIP seating"
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:bg-gray-400"
      >
        {pending ? "..." : "Add zone"}
      </button>
    </form>
  );
}
