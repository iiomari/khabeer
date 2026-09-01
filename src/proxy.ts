import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const ROLE_HOME = {
  EXPERT: "/dashboard/expert",
  CLIENT: "/dashboard/client",
  ADMIN: "/admin",
} as const;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const isAuthPage = pathname.startsWith("/auth");
  if (isAuthPage) {
    if (user) return NextResponse.redirect(new URL(ROLE_HOME[user.role], req.nextUrl));
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = new URL("/auth/login", req.nextUrl);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRole = pathname.startsWith("/admin")
    ? "ADMIN"
    : pathname.startsWith("/dashboard/expert") || pathname.startsWith("/expert/onboarding")
      ? "EXPERT"
      : pathname.startsWith("/dashboard/client") || pathname.startsWith("/booking")
        ? "CLIENT"
        : null;

  if (requiredRole && user.role !== requiredRole) {
    return NextResponse.redirect(new URL(ROLE_HOME[user.role], req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/expert/:path*", "/booking/:path*", "/bookings/:path*", "/auth/:path*"],
};
