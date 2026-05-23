"use client";

import { useTransition } from "react";
import { deleteShow, toggleShowPublished } from "../../actions";

export function ShowRowActions({
  showId,
  published,
}: {
  showId: string;
  published: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => start(() => toggleShowPublished(showId, !published))}
        disabled={pending}
        className="rounded border border-gray-400 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
      >
        {published ? "Unpublish" : "Publish"}
      </button>
      <button
        onClick={() => {
          if (
            !confirm(
              "Delete this show? This wipes ALL tickets (paid, used, reserved) and prices for it. Cannot be undone."
            )
          ) {
            return;
          }
          start(async () => {
            try {
              await deleteShow(showId);
            } catch (e) {
              alert(e instanceof Error ? e.message : "Delete failed");
            }
          });
        }}
        disabled={pending}
        className="rounded border border-red-400 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
