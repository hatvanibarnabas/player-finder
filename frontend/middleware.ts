import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const rawToken = request.cookies.get("token")?.value ?? "";
  const token = rawToken ? decodeURIComponent(rawToken) : "";
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/friends", "/messages"];
  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const isProtected =
    protectedRoutes.includes(pathname) ||
    pathname.startsWith("/messages/");

  const hasToken = token.length > 0;

  if (isProtected && !hasToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authRoutes.includes(pathname) && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/friends",
    "/messages",
    "/messages/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
