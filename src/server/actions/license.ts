"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { notify } from "@/server/notifications";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";
import { t } from "@/lib/i18n/ar";

const v = t.validation;

const licenseSchema = z.object({
  licenseNumber: z.string().trim().min(3, v.invalidLicense).max(60, v.tooLong(60)),
  licenseIssuer: z.string().trim().min(2, v.required).max(120, v.tooLong(120)),
  licenseExpiry: z.string().min(1, v.required),
  licenseDocUrl: z.string().trim().max(500, v.tooLong(500)).optional(),
});

export type LicenseResult = { ok: true } | { ok: false; error: string };

/** The expert submits their practising licence; it then waits on admin review. */
export async function submitLicenseAction(input: unknown): Promise<LicenseResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "EXPERT") return { ok: false, error: t.common.unauthorized };

  const parsed = licenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  const expiry = new Date(parsed.data.licenseExpiry);
  if (Number.isNaN(expiry.getTime())) return { ok: false, error: v.required };
  if (expiry.getTime() < Date.now()) return { ok: false, error: t.license.expiredWarning };

  await db.expertProfile.update({
    where: { userId: user.id },
    data: {
      licenseNumber: parsed.data.licenseNumber,
      licenseIssuer: parsed.data.licenseIssuer,
      licenseExpiry: expiry,
      licenseDocUrl: parsed.data.licenseDocUrl || null,
      licenseStatus: "PENDING",
      licenseRejectionReason: null,
    },
  });

  revalidatePath("/dashboard/expert");
  revalidatePath("/dashboard/expert/profile");
  revalidatePath("/admin/experts");
  return { ok: true };
}

/** Admin decision on a submitted licence. Approval is what unlocks booking. */
export async function reviewLicenseAction(
  expertProfileId: string,
  approve: boolean,
  reason?: string,
): Promise<LicenseResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { ok: false, error: t.common.unauthorized };

  const profile = await db.expertProfile.update({
    where: { id: expertProfileId },
    data: {
      licenseStatus: approve ? "APPROVED" : "REJECTED",
      licenseRejectionReason: approve ? null : reason || null,
    },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });

  await notify({
    userId: profile.userId,
    type: approve ? "LICENSE_APPROVED" : "LICENSE_REJECTED",
    title: approve ? t.license.statusApproved : t.license.statusRejected,
    body: approve ? t.license.approvedNotice : reason || t.license.rejectedNotice,
    linkUrl: "/dashboard/expert/profile",
    relatedId: expertProfileId,
  });

  await sendEmail({
    to: profile.user.email,
    subject: approve ? t.license.approvedNotice : t.license.rejectedNotice,
    text: approve
      ? `مرحبًا ${profile.user.name},\n\n${t.license.approvedNotice}`
      : `مرحبًا ${profile.user.name},\n\n${t.license.rejectedNotice}\n${reason ?? ""}`,
    action: { label: "افتح ملفك", url: `${siteUrl()}/dashboard/expert/profile` },
  });

  revalidatePath("/admin/experts");
  revalidatePath("/experts");
  return { ok: true };
}
