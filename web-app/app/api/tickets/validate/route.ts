import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type ValidatePayload = {
  qrHash: string;
};

export async function POST(req: Request) {
  // Auth: either a logged-in STAFF/ADMIN session (web) or a valid scanner API key (mobile).
  const apiKey = process.env.SCANNER_API_KEY;
  const headerKey =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  let authorized = false;
  if (apiKey && headerKey && headerKey === apiKey) {
    authorized = true;
  } else {
    const session = await getSession();
    if (session && (session.role === "STAFF" || session.role === "ADMIN")) {
      authorized = true;
    }
  }
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ValidatePayload;
  try {
    body = (await req.json()) as ValidatePayload;
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { qrHash } = body;
  if (!qrHash || typeof qrHash !== "string") {
    return NextResponse.json(
      { valid: false, error: "qrHash is required" },
      { status: 400 }
    );
  }

  // Master bypass QR: always valid, never marked used, never touches the DB.
  const bypassCode = process.env.MASTER_BYPASS_CODE;
  if (bypassCode && qrHash === bypassCode) {
    return NextResponse.json({
      valid: true,
      movie: "BYPASS (admin master ticket)",
      row: "—",
      seat: 0,
      bypass: true,
    });
  }

  type ValidationResult =
    | { status: "ok"; movie: string; row: string; seat: number }
    | { status: "not_found" }
    | {
        status: "already_used";
        scannedAt: Date;
        movie: string;
        row: string;
        seat: number;
      }
    | { status: "invalid_status"; current: string };

  const result = await prisma.$transaction(
    async (tx): Promise<ValidationResult> => {
      const ticket = await tx.ticket.findUnique({
        where: { code: qrHash },
        include: {
          show: { select: { title: true } },
          seat: { select: { rowLabel: true, seatNumber: true } },
        },
      });

      if (!ticket) {
        return { status: "not_found" };
      }

      if (ticket.status === "USED") {
        return {
          status: "already_used",
          scannedAt: ticket.updatedAt,
          movie: ticket.show.title,
          row: ticket.seat.rowLabel,
          seat: ticket.seat.seatNumber,
        };
      }

      if (ticket.status !== "PAID") {
        return { status: "invalid_status", current: ticket.status };
      }

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "USED" },
      });

      return {
        status: "ok",
        movie: ticket.show.title,
        row: ticket.seat.rowLabel,
        seat: ticket.seat.seatNumber,
      };
    }
  );

  if (result.status === "not_found") {
    return NextResponse.json(
      { valid: false, error: "Ticket not found" },
      { status: 404 }
    );
  }
  if (result.status === "already_used") {
    return NextResponse.json(
      {
        valid: false,
        error: "Ticket already used",
        scannedAt: result.scannedAt,
        movie: result.movie,
        row: result.row,
        seat: result.seat,
      },
      { status: 400 }
    );
  }
  if (result.status === "invalid_status") {
    return NextResponse.json(
      {
        valid: false,
        error: `Ticket is ${result.current}, not PAID`,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    valid: true,
    movie: result.movie,
    row: result.row,
    seat: result.seat,
  });
}
