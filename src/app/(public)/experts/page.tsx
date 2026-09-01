import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ExpertCard } from "@/components/expert-card";
import { EmptyState } from "@/components/empty-state";
import { ExpertFilters, ExpertSort } from "@/components/experts/expert-filters";
import { searchExperts } from "@/server/experts";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = {
  title: t.discovery.title,
  description: t.discovery.subtitle,
};

function toNumber(value: string | string[] | undefined) {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toText(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value[0] : value;
  return text?.trim() || undefined;
}

export default async function ExpertsPage({ searchParams }: PageProps<"/experts">) {
  const params = await searchParams;
  const page = toNumber(params.page) ?? 1;
  const sortParam = toText(params.sort);
  const sort =
    sortParam === "experience" || sortParam === "price" || sortParam === "consultations"
      ? sortParam
      : "rating";

  const [{ items, total, pageSize }, categories] = await Promise.all([
    searchExperts({
      q: toText(params.q),
      category: toText(params.category),
      city: toText(params.city),
      minYears: toNumber(params.years),
      maxPrice: toNumber(params.price),
      minRating: toNumber(params.rating),
      availableOnly: toText(params.available) === "1",
      sort,
      page,
    }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) =>
      value && key !== "page" ? [[key, Array.isArray(value) ? value[0] : value] as [string, string]] : [],
    ),
  );

  function pageHref(target: number) {
    const next = new URLSearchParams(query);
    next.set("page", String(target));
    return `/experts?${next.toString()}`;
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">{t.discovery.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.discovery.subtitle}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ExpertFilters categories={categories} />
        </aside>

        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {t.discovery.resultsCount(total)}
            </p>
            <ExpertSort />
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t.discovery.noResults}
              description={t.discovery.noResultsHint}
              action={
                <Button variant="outline" asChild>
                  <Link href="/experts">{t.common.clearAll}</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} />
                ))}
              </div>

              {totalPages > 1 ? (
                <Pagination className="mt-10">
                  <PaginationContent>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                      <PaginationItem key={number}>
                        <PaginationLink href={pageHref(number)} isActive={number === page}>
                          {formatNumber(number)}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
