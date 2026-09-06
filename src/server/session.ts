import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/lib/enums";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
    avatarUrl: session.user.avatarUrl ?? null,
  };
}

/** `next` is where to return after signing in — used when a guest hits a gated page mid-task. */
export async function requireUser(next?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login");
  return user;
}

export async function requireRole(role: UserRole, next?: string): Promise<SessionUser> {
  const user = await requireUser(next);
  if (user.role !== role) redirect("/");
  return user;
}
