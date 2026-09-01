"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export async function toggleFavoriteAction(expertId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") {
    return { ok: false as const, error: t.common.unauthorized };
  }

  const existing = await db.favorite.findUnique({
    where: { clientId_expertId: { clientId: user.id, expertId } },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
  } else {
    await db.favorite.create({ data: { clientId: user.id, expertId } });
  }

  revalidatePath(`/experts/${expertId}`);
  revalidatePath("/dashboard/client/favorites");

  return { ok: true as const, isFavorite: !existing };
}
