import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarRange, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpertCard } from "@/components/expert-card";
import { CategoryIcon } from "@/components/category-icon";
import { HeroVisual } from "@/components/home/hero-visual";
import { HowItWorks } from "@/components/home/how-it-works";
import { Testimonials } from "@/components/home/testimonials";
import { Faq } from "@/components/home/faq";
import { getFeaturedExperts } from "@/server/experts";
import { getCategoriesWithCounts, getPlatformStats, getTestimonials } from "@/server/stats";
import { formatNumber } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export default async function HomePage() {
  const [experts, categories, stats, testimonials] = await Promise.all([
    getFeaturedExperts(6),
    getCategoriesWithCounts(),
    getPlatformStats(),
    getTestimonials(3),
  ]);

  const statCards = [
    { value: formatNumber(stats.experts), label: t.home.statsExperts },
    { value: formatNumber(stats.consultations), label: t.home.statsConsultations },
    { value: formatNumber(stats.categories), label: t.home.statsFields },
    { value: stats.averageRating.toFixed(1), label: t.home.statsRating },
  ];

  return (
    <>
      <section className="hero-grid border-b">
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="fade-up space-y-7">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
              <Sparkles className="size-4 text-accent" />
              {t.home.heroBadge}
            </Badge>

            <h1 className="text-4xl leading-[1.15] font-bold sm:text-5xl lg:text-6xl">
              {t.home.heroTitle}
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t.home.heroSubtitle}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="h-13 px-7 text-base" asChild>
                <Link href="/experts">
                  {t.home.ctaPrimary}
                  <ArrowLeft className="size-4.5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-13 px-7 text-base" asChild>
                <Link href="/auth/register?role=EXPERT">{t.home.ctaSecondary}</Link>
              </Button>
            </div>

            <dl className="grid max-w-lg grid-cols-2 gap-4 border-t pt-7 sm:grid-cols-4">
              {statCards.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-2xl font-bold text-primary">{stat.value}</dd>
                  <dd className="mt-0.5 text-xs text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroVisual />
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t.home.categoriesTitle}</h2>
            <p className="mt-1.5 text-muted-foreground">{t.home.categoriesSubtitle}</p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/experts">
              {t.home.viewAllExperts}
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => (
            <li key={category.id} className="fade-up" style={{ animationDelay: `${index * 35}ms` }}>
              <Link
                href={`/experts?category=${category.slug}`}
                className="card-hover flex h-full items-center gap-3 rounded-xl border bg-card p-4 hover:bg-brand-soft/60"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
                  <CategoryIcon name={category.icon} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{category.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatNumber(category.expertCount)} {t.home.statsExperts}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {experts.length > 0 ? (
        <section className="border-y bg-card/60 py-16 lg:py-20">
          <div className="container-page">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{t.home.featuredTitle}</h2>
              <p className="mt-1.5 text-muted-foreground">{t.home.featuredSubtitle}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {experts.map((expert, index) => (
                <div key={expert.id} className="fade-up" style={{ animationDelay: `${index * 70}ms` }}>
                  <ExpertCard expert={expert} />
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/experts">
                  {t.home.viewAllExperts}
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section id="how-it-works" className="container-page scroll-mt-20 py-16 lg:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.home.howTitle}</h2>
          <p className="mx-auto mt-1.5 max-w-2xl text-muted-foreground">{t.home.howSubtitle}</p>
        </div>
        <HowItWorks />
      </section>

      <section id="about" className="scroll-mt-20 border-t bg-card/60 py-16 lg:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold sm:text-3xl">{t.home.aboutTitle}</h2>
            <p className="text-base leading-relaxed text-muted-foreground">{t.home.aboutBody}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: BadgeCheck, title: t.home.aboutPointOne, body: t.home.aboutPointOneBody },
              { icon: CalendarRange, title: t.home.aboutPointTwo, body: t.home.aboutPointTwoBody },
              { icon: Sparkles, title: t.home.aboutPointThree, body: t.home.aboutPointThreeBody },
            ].map((point) => (
              <Card key={point.title} className="flex-row items-start gap-3 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
                  <point.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{point.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{point.body}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length > 0 ? (
        <section className="border-t bg-card/60 py-16 lg:py-20">
          <div className="container-page">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">{t.home.testimonialsTitle}</h2>
              <p className="mt-1.5 text-muted-foreground">{t.home.testimonialsSubtitle}</p>
            </div>
            <Testimonials items={testimonials} />
          </div>
        </section>
      ) : null}

      <section id="faq" className="container-page scroll-mt-20 py-16 lg:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.home.faqTitle}</h2>
          <p className="mt-1.5 text-muted-foreground">{t.home.faqSubtitle}</p>
        </div>
        <Faq />
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="hero-grid flex flex-col items-center gap-5 rounded-3xl border bg-card px-6 py-14 text-center">
          <h2 className="max-w-2xl text-2xl font-bold sm:text-3xl">{t.home.ctaBannerTitle}</h2>
          <p className="max-w-xl text-muted-foreground">{t.home.ctaBannerBody}</p>
          <Button size="lg" className="h-13 px-7 text-base" asChild>
            <Link href="/auth/register?role=EXPERT">
              {t.home.ctaBannerAction}
              <ArrowLeft className="size-4.5" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
