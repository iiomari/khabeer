"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { syncExpertMinPrice } from "@/server/experts";
import {
  availabilitySchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  profileBasicsSchema,
  serviceSchema,
  skillSchema,
} from "@/lib/validation";
import { t } from "@/lib/i18n/ar";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function requireExpertProfile() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EXPERT") return null;

  const profile = await db.expertProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, verificationStatus: true },
  });

  return profile ? { userId: user.id, profile } : null;
}

function invalidate(userId: string) {
  revalidatePath("/expert/onboarding");
  revalidatePath("/dashboard/expert");
  revalidatePath("/dashboard/expert/profile");
  revalidatePath("/dashboard/expert/services");
  revalidatePath(`/experts/${userId}`);
}

export async function saveProfileBasicsAction(input: unknown): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const parsed = profileBasicsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  const { categoryIds, ...basics } = parsed.data;

  await db.$transaction([
    db.expertProfile.update({
      where: { id: context.profile.id },
      data: { ...basics, onboardingStep: 2 },
    }),
    db.expertCategory.deleteMany({ where: { expertProfileId: context.profile.id } }),
    db.expertCategory.createMany({
      data: categoryIds.map((categoryId) => ({
        expertProfileId: context.profile.id,
        categoryId,
      })),
    }),
    db.user.update({ where: { id: context.userId }, data: { city: basics.city } }),
  ]);

  invalidate(context.userId);
  return { ok: true };
}

export async function addExperienceAction(input: unknown): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  await db.experience.create({
    data: {
      expertProfileId: context.profile.id,
      organization: parsed.data.organization,
      position: parsed.data.position,
      startYear: parsed.data.startYear,
      endYear: parsed.data.isCurrent ? null : (parsed.data.endYear ?? null),
      isCurrent: parsed.data.isCurrent,
      description: parsed.data.description || null,
    },
  });

  invalidate(context.userId);
  return { ok: true };
}

export async function addEducationAction(input: unknown): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  await db.education.create({
    data: {
      expertProfileId: context.profile.id,
      institution: parsed.data.institution,
      degree: parsed.data.degree,
      field: parsed.data.field || null,
      graduationYear: parsed.data.graduationYear ?? null,
    },
  });

  invalidate(context.userId);
  return { ok: true };
}

export async function addCertificationAction(input: unknown): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const parsed = certificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  await db.certification.create({
    data: {
      expertProfileId: context.profile.id,
      name: parsed.data.name,
      issuer: parsed.data.issuer,
      issueYear: parsed.data.issueYear ?? null,
      credentialUrl: parsed.data.credentialUrl || null,
    },
  });

  invalidate(context.userId);
  return { ok: true };
}

export async function addSkillAction(input: unknown): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  await db.skill.create({
    data: { expertProfileId: context.profile.id, name: parsed.data.name },
  });

  invalidate(context.userId);
  return { ok: true };
}

export async function saveServiceAction(input: unknown, serviceId?: string): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  if (serviceId) {
    const existing = await db.consultingService.findUnique({ where: { id: serviceId } });
    if (!existing || existing.expertProfileId !== context.profile.id) {
      return { ok: false, error: t.common.unauthorized };
    }
    await db.consultingService.update({ where: { id: serviceId }, data: parsed.data });
  } else {
    await db.consultingService.create({
      data: { ...parsed.data, expertProfileId: context.profile.id },
    });
  }

  await syncExpertMinPrice(context.profile.id);
  invalidate(context.userId);
  return { ok: true };
}

export async function addAvailabilityAction(input: unknown): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t.common.somethingWentWrong };
  }

  await db.availabilitySlot.create({
    data: { ...parsed.data, expertProfileId: context.profile.id },
  });

  invalidate(context.userId);
  return { ok: true };
}

type DeletableEntity = "experience" | "education" | "certification" | "skill" | "service" | "availability";

export async function deleteProfileItemAction(
  entity: DeletableEntity,
  id: string,
): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const where = { id, expertProfileId: context.profile.id };

  switch (entity) {
    case "experience":
      await db.experience.deleteMany({ where });
      break;
    case "education":
      await db.education.deleteMany({ where });
      break;
    case "certification":
      await db.certification.deleteMany({ where });
      break;
    case "skill":
      await db.skill.deleteMany({ where });
      break;
    case "service":
      await db.consultingService.deleteMany({ where });
      await syncExpertMinPrice(context.profile.id);
      break;
    case "availability":
      await db.availabilitySlot.deleteMany({ where });
      break;
  }

  invalidate(context.userId);
  return { ok: true };
}

export async function publishProfileAction(): Promise<Result> {
  const context = await requireExpertProfile();
  if (!context) return { ok: false, error: t.common.unauthorized };

  const profile = await db.expertProfile.findUniqueOrThrow({
    where: { id: context.profile.id },
    select: {
      headline: true,
      bio: true,
      yearsOfExperience: true,
      _count: { select: { services: true, availability: true, categories: true } },
    },
  });

  if (!profile.headline || !profile.bio || profile.yearsOfExperience < 1) {
    return { ok: false, error: t.onboarding.incompleteStep };
  }
  if (profile._count.categories === 0) return { ok: false, error: t.onboarding.needCategory };
  if (profile._count.services === 0) return { ok: false, error: t.onboarding.needService };
  if (profile._count.availability === 0) return { ok: false, error: t.onboarding.needAvailability };

  await db.expertProfile.update({
    where: { id: context.profile.id },
    data: {
      verificationStatus: "PENDING",
      publishedAt: new Date(),
      onboardingStep: 4,
      rejectionReason: null,
    },
  });

  invalidate(context.userId);
  revalidatePath("/admin/experts");
  return { ok: true };
}
