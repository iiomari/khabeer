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
    // Keep the query too — a booking carries its brief id there.
    loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRole = pathname.startsWith("/admin")
    ? "ADMIN"
    : pathname.startsWith("/dashboard/expert") || pathname.startsWith("/expert/onboarding")
      ? "EXPERT"
      // The trailing slash matters: without it this also matched "/bookings/<id>",
      // the shared consultation page, and bounced every expert away from their
      // own bookings — including when they arrived from a notification.
      : pathname.startsWith("/dashboard/client") || pathname.startsWith("/booking/")
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
