import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/friends", "/messages"];
  const authRoutes = ["/login", "/register"];

  const isProtected =
    protectedRoutes.includes(pathname) ||
    pathname.startsWith("/messages/");

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authRoutes.includes(pathname) && token) {
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
  ],
};
