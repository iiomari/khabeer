import type { BookingStatus } from "@/lib/enums";

/** A confirmed booking becomes "completed" once its scheduled time has passed. */
export function resolveBookingStatus(booking: {
  status: string;
  scheduledAt: Date;
  durationMinutes: number;
}): BookingStatus {
  if (booking.status !== "CONFIRMED") return booking.status as BookingStatus;

  const endsAt = booking.scheduledAt.getTime() + booking.durationMinutes * 60_000;
  return endsAt < Date.now() ? "COMPLETED" : "CONFIRMED";
}

export const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-warning/15 text-warning-foreground border-warning/30",
  CONFIRMED: "bg-success/12 text-success border-success/30",
  COMPLETED: "bg-primary/10 text-primary border-primary/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};
