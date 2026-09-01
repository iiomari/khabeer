import Link from "next/link";
import { CalendarClock, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { resolveBookingStatus, STATUS_STYLES } from "@/lib/booking-status";
import { formatDateTime, formatSar } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

export type BookingListItem = {
  id: string;
  bookingRef: string;
  status: string;
  scheduledAt: Date;
  durationMinutes: number;
  priceSar: number;
  service: { name: string };
  client?: { name: string; avatarUrl: string | null };
  expert?: { name: string; avatarUrl: string | null };
};

export function BookingList({
  bookings,
  perspective,
}: {
  bookings: BookingListItem[];
  perspective: "client" | "expert";
}) {
  return (
    <ul className="space-y-3">
      {bookings.map((booking) => {
        const status = resolveBookingStatus(booking);
        const counterpart = perspective === "client" ? booking.expert : booking.client;

        return (
          <li key={booking.id}>
            <Card className="p-0">
              <Link
                href={`/bookings/${booking.id}`}
                className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
              >
                {counterpart ? (
                  <UserAvatar
                    name={counterpart.name}
                    src={counterpart.avatarUrl}
                    className="size-11"
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">{booking.service.name}</h3>
                    <Badge className={cn("border text-xs", STATUS_STYLES[status])}>
                      {t.booking.statuses[status]}
                    </Badge>
                  </div>
                  {counterpart ? (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {perspective === "client" ? t.booking.expert : t.booking.client}:{" "}
                      {counterpart.name}
                    </p>
                  ) : null}
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" />
                    {formatDateTime(booking.scheduledAt)}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <span className="font-bold text-primary">{formatSar(booking.priceSar)}</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    {t.common.view}
                    <ChevronLeft className="size-4" />
                  </span>
                </div>
              </Link>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
