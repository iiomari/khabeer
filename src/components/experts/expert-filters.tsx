"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SAUDI_CITIES } from "@/lib/constants";
import { t } from "@/lib/i18n/ar";

const ANY = "any";

const YEARS_OPTIONS = [10, 15, 20, 25, 30];
const PRICE_OPTIONS = [500, 800, 1000, 1500];
const RATING_OPTIONS = [3, 4, 4.5];

export type FilterCategory = { id: string; name: string; slug: string };

function FilterFields({
  categories,
  onChange,
  values,
}: {
  categories: FilterCategory[];
  onChange: (key: string, value: string | null) => void;
  values: URLSearchParams;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="filter-category">{t.discovery.field}</Label>
        <Select
          value={values.get("category") ?? ANY}
          onValueChange={(value) => onChange("category", value === ANY ? null : value)}
        >
          <SelectTrigger id="filter-category" className="h-11 w-full">
            <SelectValue placeholder={t.discovery.anyField} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t.discovery.anyField}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-city">{t.discovery.city}</Label>
        <Select
          value={values.get("city") ?? ANY}
          onValueChange={(value) => onChange("city", value === ANY ? null : value)}
        >
          <SelectTrigger id="filter-city" className="h-11 w-full">
            <SelectValue placeholder={t.discovery.anyCity} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t.discovery.anyCity}</SelectItem>
            {SAUDI_CITIES.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-years">{t.discovery.experience}</Label>
        <Select
          value={values.get("years") ?? ANY}
          onValueChange={(value) => onChange("years", value === ANY ? null : value)}
        >
          <SelectTrigger id="filter-years" className="h-11 w-full">
            <SelectValue placeholder={t.discovery.anyExperience} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t.discovery.anyExperience}</SelectItem>
            {YEARS_OPTIONS.map((years) => (
              <SelectItem key={years} value={String(years)}>
                {t.discovery.yearsAtLeast(years)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-price">{t.discovery.price}</Label>
        <Select
          value={values.get("price") ?? ANY}
          onValueChange={(value) => onChange("price", value === ANY ? null : value)}
        >
          <SelectTrigger id="filter-price" className="h-11 w-full">
            <SelectValue placeholder={t.discovery.anyPrice} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t.discovery.anyPrice}</SelectItem>
            {PRICE_OPTIONS.map((price) => (
              <SelectItem key={price} value={String(price)}>
                حتى {price} ريال
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-rating">{t.discovery.ratingFilter}</Label>
        <Select
          value={values.get("rating") ?? ANY}
          onValueChange={(value) => onChange("rating", value === ANY ? null : value)}
        >
          <SelectTrigger id="filter-rating" className="h-11 w-full">
            <SelectValue placeholder={t.discovery.anyRating} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t.discovery.anyRating}</SelectItem>
            {RATING_OPTIONS.map((rating) => (
              <SelectItem key={rating} value={String(rating)}>
                {t.discovery.ratingAtLeast(rating)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
        <Checkbox
          id="filter-available"
          checked={values.get("available") === "1"}
          onCheckedChange={(checked) => onChange("available", checked === true ? "1" : null)}
        />
        <Label htmlFor="filter-available" className="cursor-pointer font-normal">
          {t.discovery.availableThisWeek}
        </Label>
      </div>
    </div>
  );
}

export function ExpertFilters({ categories }: { categories: FilterCategory[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
      params.delete("page");
      startTransition(() => router.push(`/experts?${params.toString()}`, { scroll: false }));
    },
    [router, searchParams],
  );

  const activeCount = ["category", "city", "years", "price", "rating", "available"].filter((key) =>
    searchParams.get(key),
  ).length;

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    updateParam("q", query.trim() || null);
  }

  function clearAll() {
    setQuery("");
    startTransition(() => router.push("/experts", { scroll: false }));
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitSearch} className="flex gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.discovery.searchPlaceholder}
            aria-label={t.discovery.searchPlaceholder}
            className="h-12 ps-11"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6">
          {t.common.search}
        </Button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="lg" className="h-12 gap-2 lg:hidden">
              <SlidersHorizontal className="size-4.5" />
              {t.discovery.filters}
              {activeCount > 0 ? (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t.discovery.filters}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">
              <FilterFields
                categories={categories}
                onChange={updateParam}
                values={searchParams as unknown as URLSearchParams}
              />
              {activeCount > 0 ? (
                <Button variant="ghost" className="mt-5 w-full gap-2" onClick={clearAll}>
                  <X className="size-4" />
                  {t.common.clearAll}
                </Button>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      </form>

      <div className="hidden rounded-xl border bg-card p-5 lg:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="size-4.5" />
            {t.discovery.filters}
          </h2>
          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={clearAll}>
              <X className="size-3.5" />
              {t.common.clearAll}
            </Button>
          ) : null}
        </div>
        <FilterFields
          categories={categories}
          onChange={updateParam}
          values={searchParams as unknown as URLSearchParams}
        />
      </div>
    </div>
  );
}

export function ExpertSort() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`/experts?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort" className="shrink-0 text-sm text-muted-foreground">
        {t.discovery.sortBy}
      </Label>
      <Select value={searchParams.get("sort") ?? "rating"} onValueChange={onChange}>
        <SelectTrigger id="sort" className="h-11 w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rating">{t.discovery.sortRating}</SelectItem>
          <SelectItem value="experience">{t.discovery.sortExperience}</SelectItem>
          <SelectItem value="price">{t.discovery.sortPrice}</SelectItem>
          <SelectItem value="consultations">{t.discovery.sortConsultations}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
