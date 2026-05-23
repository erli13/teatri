"use client";

import { useTransition } from "react";
import { addSeats, deleteSeat, deleteZone } from "../../../actions";

type Seat = { id: string; rowLabel: string; seatNumber: number };

export function ZoneSection({
  zone,
}: {
  zone: { id: string; name: string; description: string | null; seats: Seat[] };
}) {
  const [pending, start] = useTransition();

  return (
    <div className="rounded border border-gray-300 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <p className="font-semibold">{zone.name}</p>
          <p className="text-xs text-black">
            {zone.description ?? "—"} · {zone.seats.length} seats
          </p>
        </div>
        <button
          onClick={() => {
            if (!confirm(`Delete zone "${zone.name}"?`)) return;
            start(async () => {
              try {
                await deleteZone(zone.id);
              } catch (e) {
                alert(e instanceof Error ? e.message : "Delete failed");
              }
            });
          }}
          disabled={pending}
          className="rounded border border-red-400 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Delete zone
        </button>
      </div>

      <form
        action={(fd) =>
          start(async () => {
            try {
              await addSeats(zone.id, fd);
            } catch (e) {
              alert(e instanceof Error ? e.message : "Add seats failed");
            }
          })
        }
        className="mb-3 flex flex-wrap items-end gap-2 border-t border-gray-200 pt-3"
      >
        <label className="block">
          <span className="block text-xs text-black">
            Rows — letters, numbers, or labels
          </span>
          <input
            name="rows"
            required
            placeholder="A-E or 1-5 or VIP"
            title='Examples: "A-E", "1-5", "A,B,C", "5,8-10", "VIP". Ranges only work between single letters or numbers; anything else is kept verbatim.'
            className="mt-1 w-40 rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-black">Seats / row</span>
          <input
            name="seatsPerRow"
            type="number"
            min={1}
            required
            placeholder="10"
            className="mt-1 w-24 rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-black">Starts at #</span>
          <input
            name="startNumber"
            type="number"
            min={1}
            defaultValue={1}
            className="mt-1 w-20 rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:bg-gray-400"
        >
          {pending ? "..." : "Add seats"}
        </button>
      </form>

      {zone.seats.length > 0 && (
        <div className="space-y-1">
          {groupByRow(zone.seats).map(([row, seats]) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-xs text-black">{row}</span>
              <div className="flex flex-wrap gap-1">
                {seats.map((seat) => (
                  <button
                    key={seat.id}
                    title={`Delete ${seat.rowLabel}${seat.seatNumber}`}
                    onClick={() => {
                      if (
                        !confirm(
                          `Delete seat ${seat.rowLabel}${seat.seatNumber}? (only allowed if no tickets reference it)`
                        )
                      )
                        return;
                      start(async () => {
                        try {
                          await deleteSeat(seat.id);
                        } catch (e) {
                          alert(
                            e instanceof Error ? e.message : "Delete failed"
                          );
                        }
                      });
                    }}
                    className="h-7 w-7 rounded bg-gray-300 text-[10px] font-medium text-black hover:bg-red-200"
                  >
                    {seat.seatNumber}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-2 text-xs text-black">
            Click a seat to delete it (only works if no tickets reference it).
          </p>
        </div>
      )}
    </div>
  );
}

function groupByRow(seats: Seat[]): [string, Seat[]][] {
  const m = new Map<string, Seat[]>();
  for (const s of seats) {
    if (!m.has(s.rowLabel)) m.set(s.rowLabel, []);
    m.get(s.rowLabel)!.push(s);
  }
  for (const arr of m.values()) arr.sort((a, b) => a.seatNumber - b.seatNumber);
  // Natural sort: "2" before "10", numeric labels before alphabetic, etc.
  return Array.from(m.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}
