import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Marks the regulated fields and brings every existing expert's licence state in
 * line with the categories they already picked.
 *
 * These seven fields require a practising licence in Saudi Arabia, so an expert
 * in any of them cannot be booked until the licence is submitted and approved.
 * Re-runnable.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED });
const db = new PrismaClient({ adapter });

const REGULATED = [
  "engineering",       // الاستشارات الهندسية
  "legal",             // الاستشارات القانونية
  "finance",           // الاستشارات المالية والاستثمارية
  "industry",          // الاستشارات الصناعية
  "mining",            // الاستشارات التعدينية
  "chemical",          // الاستشارات الكيميائية
  "education",         // الاستشارات التعليمية والتربوية
];

/** Two fields from the user's list had no category yet. */
const MISSING_CATEGORIES = [
  { name: "الاستشارات التعدينية", slug: "mining", icon: "Pickaxe", sortOrder: 18 },
  { name: "الاستشارات الكيميائية", slug: "chemical", icon: "FlaskConical", sortOrder: 19 },
];

/** Plausible licence records so verified experts stay bookable in the demo. */
const ISSUERS: Record<string, string> = {
  engineering: "الهيئة السعودية للمهندسين",
  legal: "الهيئة السعودية للمحامين",
  finance: "الهيئة السعودية للمراجعين والمحاسبين",
  industry: "وزارة الصناعة والثروة المعدنية",
  mining: "وزارة الصناعة والثروة المعدنية",
  chemical: "الهيئة السعودية للمواصفات والمقاييس والجودة",
  education: "هيئة تقويم التعليم والتدريب",
};

async function main() {
  for (const category of MISSING_CATEGORIES) {
    await db.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  await db.category.updateMany({ data: { requiresLicense: false } });
  const regulated = await db.category.updateMany({
    where: { slug: { in: REGULATED } },
    data: { requiresLicense: true },
  });

  const profiles = await db.expertProfile.findMany({
    select: {
      id: true,
      verificationStatus: true,
      licenseStatus: true,
      categories: { select: { category: { select: { slug: true, requiresLicense: true } } } },
    },
  });

  let needsLicence = 0;
  let approved = 0;

  for (const profile of profiles) {
    const regulatedSlug = profile.categories.find((link) => link.category.requiresLicense)?.category.slug;

    if (!regulatedSlug) {
      await db.expertProfile.update({
        where: { id: profile.id },
        data: { licenseStatus: "NOT_REQUIRED" },
      });
      continue;
    }

    needsLicence += 1;

    // Already-verified experts keep working: they get an approved licence on file.
    // Everyone else starts at MISSING so the gate is visible in the demo.
    if (profile.verificationStatus === "VERIFIED") {
      const year = 2027 + (approved % 3);
      await db.expertProfile.update({
        where: { id: profile.id },
        data: {
          licenseStatus: "APPROVED",
          licenseNumber: `SA-${regulatedSlug.slice(0, 3).toUpperCase()}-${(10000 + approved * 137).toString()}`,
          licenseIssuer: ISSUERS[regulatedSlug] ?? "الجهة المختصة",
          licenseExpiry: new Date(`${year}-12-31T00:00:00Z`),
          licenseRejectionReason: null,
        },
      });
      approved += 1;
    } else {
      await db.expertProfile.update({
        where: { id: profile.id },
        data: { licenseStatus: "MISSING" },
      });
    }
  }

  console.log({
    مجالات_مرخصة: regulated.count,
    خبراء_يحتاجون_رخصة: needsLicence,
    رخص_معتمدة: approved,
    إجمالي_المجالات: await db.category.count(),
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
