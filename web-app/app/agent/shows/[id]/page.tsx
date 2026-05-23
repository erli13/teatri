"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type Seat = {
  id: string;
  rowLabel: string;
  seatNumber: number;
  isTaken: boolean;
};

type Zone = {
  id: string;
  name: string;
  description: string | null;
  seats: Seat[];
};

type SeatsResponse = {
  showId: string;
  zones: Zone[];
};

type Price = {
  id: string;
  zoneId: string;
  price: string;
  currency: string;
  zone: { id: string; name: string };
};

type ShowDetail = {
  id: string;
  title: string;
  startsAt: string;
  venue: { name: string };
  prices: Price[];
};

type SelectedSeat = Seat & { zoneId: string; zoneName: string };

export default function AgentShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: showId } = use(params);

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const priceByZone = useMemo(() => {
    const m = new Map<string, number>();
    show?.prices.forEach((p) => m.set(p.zoneId, Number(p.price)));
    return m;
  }, [show]);

  const currency = show?.prices[0]?.currency ?? "ALL";

  const loadData = useCallback(async () => {
    setLoading(true);
    const [showRes, seatsRes] = await Promise.all([
      fetch(`/api/shows/${showId}`),
      fetch(`/api/shows/${showId}/seats`),
    ]);
    const showData: ShowDetail = await showRes.json();
    const seatsData: SeatsResponse = await seatsRes.json();
    setShow(showData);
    setZones(seatsData.zones);
    setLoading(false);
  }, [showId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSeat = (seat: Seat, zone: Zone) => {
    if (seat.isTaken) return;
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      if (exists) return prev.filter((s) => s.id !== seat.id);
      return [...prev, { ...seat, zoneId: zone.id, zoneName: zone.name }];
    });
  };

  const total = selectedSeats.reduce(
    (sum, s) => sum + (priceByZone.get(s.zoneId) ?? 0),
    0
  );

  const checkout = async () => {
    if (selectedSeats.length === 0 || submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/shows/${showId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seatIds: selectedSeats.map((s) => s.id),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Booking failed" }));
        setNotice({
          kind: "error",
          message: `Booking failed: ${err.error ?? res.statusText}`,
        });
        return;
      }
      const booking: { tickets: { seatId: string; code: string }[] } =
        await res.json();

      await downloadTicketQRCodes(booking.tickets);

      setSelectedSeats([]);
      setNotice({
        kind: "success",
        message: `Sale complete — ${booking.tickets.length} ticket${
          booking.tickets.length === 1 ? "" : "s"
        } downloading.`,
      });
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <p className="text-slate-800">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <a
            href="/agent"
            className="text-sm text-blue-600 hover:underline"
          >
            ← All shows
          </a>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {show?.title}
          </h1>
          <p className="text-sm text-slate-800">
            {show && new Date(show.startsAt).toLocaleString()} · {show?.venue.name}
          </p>
        </header>

        {notice && (
          <div
            role="status"
            className={`mb-4 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
              notice.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <span>{notice.message}</span>
            <button
              onClick={() => setNotice(null)}
              className="text-xs font-medium underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Seat Map
            </h2>

            <div className="mb-4 flex gap-4 text-xs text-slate-800">
              <Legend color="bg-green-500" label="Available" />
              <Legend color="bg-blue-500" label="Selected" />
              <Legend color="bg-slate-400" label="Taken" />
            </div>

            <div className="space-y-6">
              {zones.map((zone) => (
                <div key={zone.id}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="font-semibold text-slate-800">
                      {zone.name}
                    </h3>
                    <span className="text-xs text-slate-800">
                      {priceByZone.get(zone.id) ?? "—"} {currency}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {groupByRow(zone.seats).map(([row, seats]) => (
                      <div key={row} className="flex items-center gap-2">
                        <span className="w-5 text-xs font-medium text-slate-800">
                          {row}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {seats.map((seat) => {
                            const selected = selectedSeats.some(
                              (s) => s.id === seat.id
                            );
                            const cls = seat.isTaken
                              ? "bg-slate-400 cursor-not-allowed"
                              : selected
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-green-500 hover:bg-green-600";
                            return (
                              <button
                                key={seat.id}
                                onClick={() => toggleSeat(seat, zone)}
                                disabled={seat.isTaken}
                                title={`${seat.rowLabel}${seat.seatNumber}`}
                                className={`h-7 w-7 rounded text-[10px] font-medium text-white ${cls}`}
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
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Cart ({selectedSeats.length})
            </h2>

            {selectedSeats.length === 0 ? (
              <p className="text-sm text-slate-800">No seats selected.</p>
            ) : (
              <ul className="mb-4 space-y-2">
                {selectedSeats.map((s) => (
                  <li
                    key={s.id}
                    className="flex justify-between text-sm text-black"
                  >
                    <span>
                      {s.zoneName} · {s.rowLabel}
                      {s.seatNumber}
                    </span>
                    <span className="font-medium">
                      {priceByZone.get(s.zoneId) ?? 0} {currency}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mb-4 flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
              <span>Total</span>
              <span>
                {total} {currency}
              </span>
            </div>

            <button
              onClick={checkout}
              disabled={selectedSeats.length === 0 || submitting}
              className="w-full rounded-md bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Processing..." : "Confirm Cash Payment"}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}

async function downloadTicketQRCodes(
  tickets: { seatId: string; code: string }[]
) {
  for (const ticket of tickets) {
    const dataUrl = await QRCode.toDataURL(ticket.code, {
      width: 512,
      margin: 2,
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `ticket-${ticket.seatId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Tiny stagger so browsers don't collapse multiple identical-trigger downloads.
    await new Promise((r) => setTimeout(r, 150));
  }
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded ${color}`} />
      {label}
    </span>
  );
}

function groupByRow(seats: Seat[]): [string, Seat[]][] {
  const map = new Map<string, Seat[]>();
  for (const s of seats) {
    if (!map.has(s.rowLabel)) map.set(s.rowLabel, []);
    map.get(s.rowLabel)!.push(s);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.seatNumber - b.seatNumber);
  }
  return Array.from(map.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}
