"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";

// ---------- Shows ----------

export async function createShow(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  const venueId = String(formData.get("venueId") ?? "");

  if (!title || !startsAt || !venueId) {
    throw new Error("title, startsAt and venueId are required");
  }

  const show = await prisma.show.create({
    data: {
      title,
      description,
      startsAt: new Date(startsAt),
      endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
      venueId,
    },
  });
  revalidatePath("/admin/shows");
  redirect(`/admin/shows/${show.id}`);
}

export async function updateShow(showId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");

  await prisma.show.update({
    where: { id: showId },
    data: {
      title,
      description,
      startsAt: new Date(startsAt),
      endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
    },
  });
  revalidatePath(`/admin/shows/${showId}`);
  revalidatePath("/admin/shows");
}

export async function toggleShowPublished(showId: string, published: boolean) {
  await requireAdmin();
  await prisma.show.update({
    where: { id: showId },
    data: { published },
  });
  revalidatePath("/admin/shows");
  revalidatePath(`/admin/shows/${showId}`);
  revalidatePath("/agent");
}

export async function deleteShow(showId: string) {
  await requireAdmin();
  // Hard delete — wipes all tickets (incl. PAID/USED), prices, then the show.
  // Used after the show has run and you no longer need its records.
  await prisma.$transaction(async (tx) => {
    await tx.ticket.deleteMany({ where: { showId } });
    await tx.showPrice.deleteMany({ where: { showId } });
    await tx.show.delete({ where: { id: showId } });
  });
  revalidatePath("/admin/shows");
  redirect("/admin/shows");
}

// ---------- Show Prices ----------

export async function setShowPrice(
  showId: string,
  zoneId: string,
  formData: FormData
) {
  await requireAdmin();
  const priceRaw = String(formData.get("price") ?? "");
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a non-negative number");
  }
  const currency = String(formData.get("currency") ?? "ALL") || "ALL";

  await prisma.showPrice.upsert({
    where: { showId_zoneId: { showId, zoneId } },
    update: { price, currency },
    create: { showId, zoneId, price, currency },
  });
  revalidatePath(`/admin/shows/${showId}`);
}

// ---------- Admin Reservations ----------

async function getOrCreateSystemUser() {
  return prisma.user.upsert({
    where: { id: "system-admin" },
    update: {},
    create: {
      id: "system-admin",
      email: "system@theatre.al",
      name: "System (admin reservations)",
      password: "x",
      role: "ADMIN",
    },
  });
}

export async function reserveSeats(showId: string, formData: FormData) {
  await requireAdmin();
  const seatIdsRaw = formData.getAll("seatIds").map(String).filter(Boolean);
  if (seatIdsRaw.length === 0) {
    throw new Error("Pick at least one seat to reserve");
  }
  const sys = await getOrCreateSystemUser();

  await prisma.$transaction(async (tx) => {
    // Block if any of these seats already have an active ticket
    const existing = await tx.ticket.findMany({
      where: {
        showId,
        seatId: { in: seatIdsRaw },
        status: { in: ["RESERVED", "PAID", "USED"] },
      },
      select: { seatId: true },
    });
    if (existing.length > 0) {
      throw new Error(
        `Some seats already have active tickets (${existing.length})`
      );
    }
    // Need a price for each zone; if missing, fail loud.
    const seats = await tx.seat.findMany({
      where: { id: { in: seatIdsRaw } },
      select: { id: true, zoneId: true },
    });
    const zoneIds = Array.from(new Set(seats.map((s) => s.zoneId)));
    const prices = await tx.showPrice.findMany({
      where: { showId, zoneId: { in: zoneIds } },
    });
    const priceByZone = new Map(prices.map((p) => [p.zoneId, p]));
    for (const z of zoneIds) {
      if (!priceByZone.has(z)) {
        throw new Error(`Set a price for every zone before reserving seats`);
      }
    }
    for (const seat of seats) {
      const p = priceByZone.get(seat.zoneId)!;
      await tx.ticket.create({
        data: {
          showId,
          seatId: seat.id,
          userId: sys.id,
          price: p.price,
          currency: p.currency,
          status: "RESERVED",
          code: randomUUID(),
        },
      });
    }
  });
  revalidatePath(`/admin/shows/${showId}`);
}

export async function releaseReservation(showId: string, ticketId: string) {
  await requireAdmin();
  const t = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!t || t.status !== "RESERVED") {
    throw new Error("Can only release RESERVED tickets");
  }
  await prisma.ticket.delete({ where: { id: ticketId } });
  revalidatePath(`/admin/shows/${showId}`);
}

// ---------- Agents ----------

export async function createAgent(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  if (!email) throw new Error("email is required");
  if (password.length < 6)
    throw new Error("password must be at least 6 characters");

  await prisma.user.create({
    data: {
      email,
      name,
      password: await hashPassword(password),
      role: "STAFF",
    },
  });
  revalidatePath("/admin/agents");
}

export async function toggleAgentActive(userId: string, active: boolean) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { active },
  });
  revalidatePath("/admin/agents");
}

// ---------- Master bypass QR ----------

export async function getBypassCode(): Promise<string> {
  await requireAdmin();
  const code = process.env.MASTER_BYPASS_CODE;
  if (!code) throw new Error("MASTER_BYPASS_CODE is not configured");
  return code;
}

// ---------- Venues / Zones / Seats ----------

export async function createVenue(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  if (!name) throw new Error("name is required");
  await prisma.venue.create({ data: { name, address, city } });
  revalidatePath("/admin/venues");
}

export async function deleteVenue(venueId: string) {
  await requireAdmin();
  // Block delete if shows exist.
  const showCount = await prisma.show.count({ where: { venueId } });
  if (showCount > 0)
    throw new Error("Cannot delete venue with shows attached");
  await prisma.venue.delete({ where: { id: venueId } });
  revalidatePath("/admin/venues");
  redirect("/admin/venues");
}

export async function createZone(venueId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) throw new Error("name is required");
  await prisma.seatingZone.create({ data: { venueId, name, description } });
  revalidatePath(`/admin/venues/${venueId}`);
}

export async function deleteZone(zoneId: string) {
  await requireAdmin();
  const sold = await prisma.ticket.count({
    where: {
      seat: { zoneId },
      status: { in: ["PAID", "USED"] },
    },
  });
  if (sold > 0)
    throw new Error("Cannot delete zone with sold tickets");
  const zone = await prisma.seatingZone.findUnique({ where: { id: zoneId } });
  await prisma.seatingZone.delete({ where: { id: zoneId } });
  if (zone) revalidatePath(`/admin/venues/${zone.venueId}`);
}

export async function addSeats(zoneId: string, formData: FormData) {
  await requireAdmin();
  const rows = String(formData.get("rows") ?? "").trim(); // e.g. "A-E" or "A,B,C"
  const seatsPerRowRaw = String(formData.get("seatsPerRow") ?? "");
  const startNumberRaw = String(formData.get("startNumber") ?? "1");
  const seatsPerRow = parseInt(seatsPerRowRaw, 10);
  const startNumber = parseInt(startNumberRaw, 10);
  if (!Number.isFinite(seatsPerRow) || seatsPerRow < 1)
    throw new Error("seatsPerRow must be ≥ 1");
  if (!Number.isFinite(startNumber) || startNumber < 1)
    throw new Error("startNumber must be ≥ 1");

  const rowLabels = expandRowSpec(rows);
  if (rowLabels.length === 0) throw new Error("invalid row spec");

  const zone = await prisma.seatingZone.findUnique({ where: { id: zoneId } });
  if (!zone) throw new Error("zone not found");

  const data = rowLabels.flatMap((row) =>
    Array.from({ length: seatsPerRow }, (_, i) => ({
      zoneId,
      rowLabel: row,
      seatNumber: startNumber + i,
    }))
  );
  // Use createMany with skipDuplicates so re-running the same spec is safe.
  await prisma.seat.createMany({ data, skipDuplicates: true });
  revalidatePath(`/admin/venues/${zone.venueId}`);
}

export async function deleteSeat(seatId: string) {
  await requireAdmin();
  const ticketCount = await prisma.ticket.count({ where: { seatId } });
  if (ticketCount > 0) throw new Error("Cannot delete seat with tickets");
  const seat = await prisma.seat.findUnique({
    where: { id: seatId },
    include: { zone: { select: { venueId: true } } },
  });
  await prisma.seat.delete({ where: { id: seatId } });
  if (seat) revalidatePath(`/admin/venues/${seat.zone.venueId}`);
}

// Accepts "A-E", "A,B,C", "A,C-E", or a single letter. Returns ["A","B",...].
// Accepts any combination of:
//   "A-E"     letter range  → A,B,C,D,E
//   "1-5"     numeric range → 1,2,3,4,5
//   "A,B,C"   explicit list
//   "VIP"     a single arbitrary label (kept verbatim — no uppercasing)
//   "5,8-10"  mixed
function expandRowSpec(spec: string): string[] {
  const out: string[] = [];
  for (const part of spec.split(",").map((p) => p.trim()).filter(Boolean)) {
    // Numeric range like "1-5"
    const numRange = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (numRange) {
      let a = parseInt(numRange[1], 10);
      let b = parseInt(numRange[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) out.push(String(i));
      continue;
    }
    // Single-letter range like "A-E"
    const letterRange = part.match(/^([A-Za-z])\s*-\s*([A-Za-z])$/);
    if (letterRange) {
      let a = letterRange[1].toUpperCase().charCodeAt(0);
      let b = letterRange[2].toUpperCase().charCodeAt(0);
      if (a > b) [a, b] = [b, a];
      for (let c = a; c <= b; c++) out.push(String.fromCharCode(c));
      continue;
    }
    // Anything else — kept verbatim. Single letters are uppercased so "a" and
    // "A" don't both end up as separate rows; everything else (numbers,
    // multi-letter labels like "VIP", emojis) passes through untouched.
    if (/^[a-z]$/.test(part)) out.push(part.toUpperCase());
    else out.push(part);
  }
  return Array.from(new Set(out));
}

export async function resetAgentPassword(userId: string, formData: FormData) {
  await requireAdmin();
  const password = String(formData.get("password") ?? "");
  if (password.length < 6)
    throw new Error("password must be at least 6 characters");
  await prisma.user.update({
    where: { id: userId },
    data: { password: await hashPassword(password) },
  });
  revalidatePath("/admin/agents");
}
