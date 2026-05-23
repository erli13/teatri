"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createSessionCookie,
  verifyPassword,
  type Role,
} from "@/lib/auth";

export async function loginAction(formData: FormData, next: string | null) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=invalid");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login?error=invalid");

  const ok = await verifyPassword(password, user.password);
  if (!ok) redirect("/login?error=invalid");

  if (!user.active) redirect("/login?error=inactive");

  await createSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });

  const dest =
    next && next.startsWith("/")
      ? next
      : user.role === "ADMIN"
      ? "/admin"
      : "/agent";
  redirect(dest);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
