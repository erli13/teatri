"use client";

import Link from "next/link";

export default function VenueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-2xl rounded border border-red-300 bg-red-50 p-6">
        <h1 className="mb-2 text-xl font-bold text-red-800">
          Couldn&apos;t render this venue
        </h1>
        <p className="mb-3 text-sm text-black">
          The page failed to render. Recent data changes can be edited from the
          venue list — most likely cause is an unexpected row/seat value. The
          full error is below.
        </p>
        <pre className="mb-4 max-h-60 overflow-auto rounded bg-white p-3 text-xs">
          {error.message}
        </pre>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded bg-black px-3 py-1.5 text-sm text-white"
          >
            Try again
          </button>
          <Link
            href="/admin/venues"
            className="rounded border border-gray-400 px-3 py-1.5 text-sm hover:bg-gray-100"
          >
            ← Back to venues
          </Link>
        </div>
      </div>
    </main>
  );
}
