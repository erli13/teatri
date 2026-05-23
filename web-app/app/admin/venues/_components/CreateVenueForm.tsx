"use client";

import { useTransition } from "react";
import { createVenue } from "../../actions";

export function CreateVenueForm() {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) =>
        start(async () => {
          try {
            await createVenue(fd);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Create failed");
          }
        })
      }
      className="flex flex-wrap items-end gap-2"
    >
      <label className="block">
        <span className="block text-xs text-black">Name</span>
        <input
          name="name"
          required
          className="mt-1 rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-black">City</span>
        <input
          name="city"
          className="mt-1 rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-black">Address</span>
        <input
          name="address"
          className="mt-1 rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:bg-gray-400"
      >
        {pending ? "..." : "Create venue"}
      </button>
    </form>
  );
}
