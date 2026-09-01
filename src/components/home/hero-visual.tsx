import { BadgeCheck, CalendarCheck, MessageSquareText, Star } from "lucide-react";

/** Composed brand visual instead of stock photography: a profile card mid-booking. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-bl from-accent/15 via-primary/10 to-transparent blur-2xl" />

      <div className="rounded-3xl border bg-card p-6 shadow-lg shadow-primary/5">
        <div className="flex items-start gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
            عف
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">عبدالله الفهد</span>
              <BadgeCheck className="size-4 text-primary" />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              مستشار مالي — الرئيس المالي السابق
            </p>
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="size-3.5 fill-accent text-accent" />
              ))}
              <span className="ms-1 text-xs font-medium">4.9</span>
              <span className="text-xs text-muted-foreground">(٣٨ تقييم)</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3.5 py-3">
            <span className="text-sm font-medium">جلسة استشارية — إعادة الهيكلة المالية</span>
            <span className="text-sm font-bold text-primary">1,200 ريال</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-3.5 py-3">
            <span className="text-sm font-medium">مراجعة خطة مالية</span>
            <span className="text-sm font-bold text-primary">750 ريال</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-center">
          <div>
            <div className="text-lg font-bold">32</div>
            <div className="text-xs text-muted-foreground">سنة خبرة</div>
          </div>
          <div>
            <div className="text-lg font-bold">146</div>
            <div className="text-xs text-muted-foreground">استشارة</div>
          </div>
          <div>
            <div className="text-lg font-bold">الرياض</div>
            <div className="text-xs text-muted-foreground">الموقع</div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -start-4 flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-md">
        <span className="flex size-9 items-center justify-center rounded-full bg-success/12 text-success">
          <CalendarCheck className="size-4.5" />
        </span>
        <div className="text-start">
          <div className="text-sm font-semibold">تم تأكيد الحجز</div>
          <div className="text-xs text-muted-foreground">الأحد ١٠:٠٠ ص</div>
        </div>
      </div>

      <div className="absolute -top-5 -end-3 flex items-center gap-2 rounded-2xl border bg-card px-4 py-3 shadow-md">
        <span className="flex size-9 items-center justify-center rounded-full bg-accent/15 text-accent">
          <MessageSquareText className="size-4.5" />
        </span>
        <div className="text-start">
          <div className="text-sm font-semibold">رسالة جديدة</div>
          <div className="text-xs text-muted-foreground">من شركة مدار الصناعية</div>
        </div>
      </div>
    </div>
  );
}
