"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { notify } from "@/server/notifications";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";
import { categorySchema } from "@/lib/validation";
import { t } from "@/lib/i18n/ar";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

function slugify(value: string) {
  return (
    value
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]/gu, "")
      .toLowerCase() || `category-${Date.now()}`
  );
}

export async function setExpertVerificationAction(
  expertProfileId: string,
  status: "VERIFIED" | "REJECTED",
  reason?: string,
) {
  if (!(await requireAdmin())) return { ok: false as const, error: t.common.unauthorized };

  const profile = await db.expertProfile.update({
    where: { id: expertProfileId },
    data: {
      verificationStatus: status,
      rejectionReason: status === "REJECTED" ? reason || null : null,
    },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });

  await notify({
    userId: profile.userId,
    type: status === "VERIFIED" ? "PROFILE_VERIFIED" : "PROFILE_REJECTED",
    title: status === "VERIFIED" ? "تم توثيق ملفك المهني" : "لم يتم اعتماد ملفك المهني",
    body:
      status === "VERIFIED"
        ? "ملفك الآن ظاهر للعملاء ويمكنهم حجز استشاراتك."
        : reason || "يرجى مراجعة بيانات ملفك المهني وإعادة إرساله.",
    linkUrl: "/dashboard/expert",
    relatedId: expertProfileId,
  });

  // Verification is the moment an expert has been waiting for, so it goes out by
  // email too rather than sitting in a bell they may not check for days.
  await sendEmail({
    to: profile.user.email,
    subject:
      status === "VERIFIED" ? "تم توثيق ملفك على منصة خبير" : "ملفك المهني يحتاج تعديلًا",
    text:
      status === "VERIFIED"
        ? `مرحبًا ${profile.user.name},\n\nاعتُمد ملفك المهني وأصبح ظاهرًا للعملاء، ويمكنهم الآن حجز استشاراتك.`
        : `مرحبًا ${profile.user.name},\n\nراجعنا ملفك المهني ولم يُعتمد بعد.\n${
            reason ? `السبب: ${reason}` : "يرجى مراجعة البيانات وإعادة الإرسال."
          }`,
    action: { label: "افتح لوحتك", url: `${siteUrl()}/dashboard/expert` },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/experts");
  revalidatePath("/experts");

  return { ok: true as const };
}

export async function toggleUserStatusAction(userId: string) {
  const admin = await requireAdmin();
  if (!admin) return { ok: false as const, error: t.common.unauthorized };
  if (admin.id === userId) return { ok: false as const, error: t.common.unauthorized };

  const user = await db.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) return { ok: false as const, error: t.common.notFound };

  const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await db.user.update({ where: { id: userId }, data: { status: nextStatus } });

  revalidatePath("/admin/users");
  revalidatePath("/admin/experts");

  return { ok: true as const, status: nextStatus };
}

export async function createCategoryAction(input: unknown) {
  if (!(await requireAdmin())) return { ok: false as const, error: t.common.unauthorized };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  const existing = await db.category.findFirst({ where: { name: parsed.data.name } });
  if (existing) return { ok: false as const, error: "هذا التصنيف موجود مسبقًا." };

  const count = await db.category.count();
  await db.category.create({
    data: { name: parsed.data.name, slug: slugify(parsed.data.name), sortOrder: count },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/experts");
  revalidatePath("/");

  return { ok: true as const };
}

export async function deleteCategoryAction(categoryId: string) {
  if (!(await requireAdmin())) return { ok: false as const, error: t.common.unauthorized };

  await db.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categories");
  revalidatePath("/experts");
  revalidatePath("/");

  return { ok: true as const };
}
