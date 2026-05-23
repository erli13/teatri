import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "ts_session";

async function readSession(token: string | undefined, secret: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    return payload as { userId: string; role: "ADMIN" | "STAFF" | "CUSTOMER" };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return new NextResponse("SESSION_SECRET not configured", { status: 500 });
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await readSession(token, secret);

  const isAdmin = pathname.startsWith("/admin");
  const isAgent = pathname.startsWith("/agent");

  if ((isAdmin || isAgent) && !session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAdmin && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login?error=forbidden", req.url));
  }
  if (
    isAgent &&
    session?.role !== "STAFF" &&
    session?.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/login?error=forbidden", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*"],
};
