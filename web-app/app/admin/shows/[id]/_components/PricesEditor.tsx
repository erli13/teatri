"use client";

import { useTransition } from "react";
import { setShowPrice } from "../../../actions";

type ZoneRow = {
  id: string;
  name: string;
  currentPrice: string;
  currency: string;
};

export function PricesEditor({
  showId,
  zones,
}: {
  showId: string;
  zones: ZoneRow[];
}) {
  return (
    <div className="space-y-2">
      {zones.map((zone) => (
        <PriceRow key={zone.id} showId={showId} zone={zone} />
      ))}
    </div>
  );
}

function PriceRow({ showId, zone }: { showId: string; zone: ZoneRow }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => setShowPrice(showId, zone.id, fd))}
      className="flex items-center gap-2 text-sm"
    >
      <span className="w-40">{zone.name}</span>
      <input
        name="price"
        type="number"
        step="0.01"
        min="0"
        required
        defaultValue={zone.currentPrice}
        placeholder="price"
        className="w-32 rounded border border-gray-300 px-2 py-1"
      />
      <input
        name="currency"
        defaultValue={zone.currency}
        className="w-20 rounded border border-gray-300 px-2 py-1"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-2 py-1 text-xs text-white disabled:bg-gray-400"
      >
        {pending ? "..." : "Save"}
      </button>
      {zone.currentPrice === "" && (
        <span className="text-xs text-amber-700">not set</span>
      )}
    </form>
  );
}
