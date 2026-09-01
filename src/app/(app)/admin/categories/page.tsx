import type { Metadata } from "next";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { getCategoriesWithCounts } from "@/server/stats";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.admin.categories };

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN");
  const categories = await getCategoriesWithCounts();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.admin.categories}</h1>
      </header>

      <CategoriesManager categories={categories} />
    </div>
  );
}
