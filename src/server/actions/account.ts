"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { accountSettingsSchema } from "@/lib/validation";
import { t } from "@/lib/i18n/ar";

export async function updateAccountAction(input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: t.common.unauthorized };

  const parsed = accountSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
    },
  });

  revalidatePath("/dashboard/client/settings");
  revalidatePath("/dashboard/expert/settings");

  return { ok: true as const };
}
