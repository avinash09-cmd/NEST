// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES   = ["/", "/login", "/register"];
const AUTH_ROUTES     = ["/login", "/register"];
const ADMIN_ROUTES    = ["/admin"];
const API_AUTH_PREFIX = "/api/auth";

export default auth(function middleware(req) {
  const { nextUrl } = req as NextRequest;
  const session     = (req as NextRequest & { auth: { user?: { role?: string } } | null }).auth;
  const pathname    = nextUrl.pathname;

  const isPublicRoute   = PUBLIC_ROUTES.includes(pathname);
  const isAuthRoute     = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isApiAuthRoute  = pathname.startsWith(API_AUTH_PREFIX);
  const isAdminRoute    = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isLoggedIn      = !!session?.user;
  const userRole        = session?.user?.role;

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isPublicRoute) return NextResponse.next();

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
