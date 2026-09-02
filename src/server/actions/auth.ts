"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validation";
import { t } from "@/lib/i18n/ar";
import type { UserRole } from "@/lib/enums";
import { DEMO_ACCOUNT_PASSWORD, NAFATH_DEMO_EMAIL } from "@/lib/demo";

export type ActionResult = { ok: true; redirectTo: string } | { ok: false; error: string };

const ROLE_HOME: Record<UserRole, string> = {
  EXPERT: "/dashboard/expert",
  CLIENT: "/dashboard/client",
  ADMIN: "/admin",
};

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t.auth.invalidCredentials };

  const email = parsed.data.email.toLowerCase();

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      const isSuspended = (error as { code?: string }).code === "suspended";
      return { ok: false, error: isSuspended ? t.auth.accountSuspended : t.auth.invalidCredentials };
    }
    throw error;
  }

  const user = await db.user.findUnique({ where: { email }, select: { role: true } });
  return { ok: true, redirectTo: user ? ROLE_HOME[user.role as UserRole] : "/" };
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { ok: false, error: t.auth.emailTaken };

  const passwordHash = await bcrypt.hash(data.password, 10);

  await db.user.create({
    data: {
      name: data.name,
      email,
      passwordHash,
      role: data.role,
      phone: data.phone || null,
      city: data.city || null,
      ...(data.role === "EXPERT"
        ? { expertProfile: { create: { city: data.city || null } } }
        : {
            clientProfile: {
              create: {
                isCompany: Boolean(data.isCompany),
                companyName: data.companyName || null,
              },
            },
          }),
    },
  });

  try {
    await signIn("credentials", { email, password: data.password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: t.common.somethingWentWrong };
    throw error;
  }

  return {
    ok: true,
    redirectTo: data.role === "EXPERT" ? "/expert/onboarding" : "/dashboard/client",
  };
}

/**
 * Simulated Nafath sign-in: no national identity provider is contacted. It signs
 * the visitor into a seeded retired-expert account so the intended flow can be
 * demonstrated, and is the single place a real Nafath integration would replace.
 */
export async function nafathDemoLoginAction(): Promise<ActionResult> {
  const user = await db.user.findUnique({
    where: { email: NAFATH_DEMO_EMAIL },
    select: { role: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return { ok: false, error: t.common.somethingWentWrong };
  }

  try {
    await signIn("credentials", {
      email: NAFATH_DEMO_EMAIL,
      password: DEMO_ACCOUNT_PASSWORD,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: t.common.somethingWentWrong };
    throw error;
  }

  return { ok: true, redirectTo: ROLE_HOME[user.role as UserRole] };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
