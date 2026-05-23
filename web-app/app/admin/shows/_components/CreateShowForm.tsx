"use client";

import { useTransition } from "react";
import { createShow } from "../../actions";

export function CreateShowForm({
  venues,
}: {
  venues: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) => start(() => createShow(fd))}
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
    >
      <label className="block">
        <span className="block text-xs text-gray-800">Title</span>
        <input
          name="title"
          required
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-gray-800">Venue</span>
        <select
          name="venueId"
          required
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        >
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block text-xs text-gray-800">Starts at</span>
        <input
          name="startsAt"
          type="datetime-local"
          required
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block text-xs text-gray-800">Ends at (optional)</span>
        <input
          name="endsAt"
          type="datetime-local"
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="block text-xs text-gray-800">Description</span>
        <textarea
          name="description"
          rows={2}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:bg-gray-400"
        >
          {pending ? "Creating..." : "Create show"}
        </button>
      </div>
    </form>
  );
}
