"use client";

import { useState, useTransition } from "react";
import { releaseReservation, reserveSeats } from "../../../actions";

type Seat = {
  id: string;
  rowLabel: string;
  seatNumber: number;
  ticketStatus: "RESERVED" | "PAID" | "USED" | null;
  ticketId: string | null;
  releasable: boolean;
};

type Zone = { id: string; name: string; seats: Seat[] };

export function SeatReservationGrid({
  showId,
  zones,
}: {
  showId: string;
  zones: Zone[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const toggle = (seat: Seat) => {
    if (seat.ticketStatus) return; // can't select taken seats
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else next.add(seat.id);
      return next;
    });
  };

  const submit = () => {
    if (selected.size === 0) return;
    const fd = new FormData();
    for (const id of selected) fd.append("seatIds", id);
    start(async () => {
      try {
        await reserveSeats(showId, fd);
        setSelected(new Set());
      } catch (e) {
        alert(e instanceof Error ? e.message : "Reservation failed");
      }
    });
  };

  const release = (ticketId: string) => {
    start(async () => {
      try {
        await releaseReservation(showId, ticketId);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Release failed");
      }
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-500" /> free
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-500" /> selected
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-500" /> reserved
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-gray-500" /> sold/used
        </span>
        <button
          onClick={submit}
          disabled={pending || selected.size === 0}
          className="ml-auto rounded bg-black px-3 py-1 text-xs text-white disabled:bg-gray-400"
        >
          {pending
            ? "..."
            : `Reserve ${selected.size} seat${selected.size === 1 ? "" : "s"}`}
        </button>
      </div>

      <div className="space-y-4">
        {zones.map((zone) => (
          <div key={zone.id}>
            <p className="mb-1 text-sm font-semibold">{zone.name}</p>
            <div className="space-y-1">
              {groupByRow(zone.seats).map(([row, seats]) => (
                <div key={row} className="flex items-center gap-2">
                  <span className="w-5 text-xs text-gray-800">{row}</span>
                  <div className="flex flex-wrap gap-1">
                    {seats.map((seat) => {
                      const isSelected = selected.has(seat.id);
                      let cls = "bg-green-500 hover:bg-green-600";
                      let title = `${seat.rowLabel}${seat.seatNumber} — free`;
                      if (seat.ticketStatus === "RESERVED") {
                        cls = "bg-amber-500";
                        title = `${seat.rowLabel}${seat.seatNumber} — reserved`;
                      } else if (
                        seat.ticketStatus === "PAID" ||
                        seat.ticketStatus === "USED"
                      ) {
                        cls = "bg-gray-500 cursor-not-allowed";
                        title = `${seat.rowLabel}${seat.seatNumber} — ${seat.ticketStatus.toLowerCase()}`;
                      } else if (isSelected) {
                        cls = "bg-blue-500";
                      }
                      const onClick =
                        seat.releasable && seat.ticketId
                          ? () => {
                              if (
                                confirm(
                                  `Release reservation on ${seat.rowLabel}${seat.seatNumber}?`
                                )
                              )
                                release(seat.ticketId!);
                            }
                          : () => toggle(seat);
                      return (
                        <button
                          key={seat.id}
                          onClick={onClick}
                          disabled={
                            pending ||
                            (seat.ticketStatus !== null && !seat.releasable)
                          }
                          title={title}
                          className={`h-7 w-7 rounded text-[10px] font-medium text-white disabled:opacity-80 ${cls}`}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-800">
        Click an amber (reserved) seat created here to release it. Sold/used
        seats can&apos;t be released from this UI.
      </p>
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
  return Array.from(m.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}
