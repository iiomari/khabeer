import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    avatarUrl?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}

export {};
