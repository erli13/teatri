import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, verifyPassword, type Role } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password required" },
      { status: 400 }
    );
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (!(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (!user.active) {
    return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
  }
  await createSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });
  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
  });
}
