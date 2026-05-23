"use client";

import { useTransition } from "react";
import { updateShow } from "../../../actions";

export function EditShowForm({
  showId,
  defaults,
}: {
  showId: string;
  defaults: {
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
  };
}) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => updateShow(showId, fd))}
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <label className="block">
        <span className="block text-xs text-gray-800">Title</span>
        <input
          name="title"
          required
          defaultValue={defaults.title}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-gray-800">Starts at</span>
        <input
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={defaults.startsAt}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-gray-800">Ends at (optional)</span>
        <input
          name="endsAt"
          type="datetime-local"
          defaultValue={defaults.endsAt}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="block text-xs text-gray-800">Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={defaults.description}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:bg-gray-400"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
