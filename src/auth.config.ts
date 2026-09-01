import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/lib/enums";

/** Edge-safe config (no database access) shared by middleware and the full server config. */
export const authConfig = {
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.avatarUrl ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as UserRole;
      session.user.avatarUrl = (token.picture as string | null) ?? null;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
