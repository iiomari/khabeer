import { db } from "@/lib/db";
import type { NotificationType } from "@/lib/enums";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  relatedId?: string;
};

export async function notify(input: NotifyInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
      relatedId: input.relatedId,
    },
  });
}

/**
 * Reminders have no scheduler in this MVP: this scan is idempotent so it can be
 * triggered on demand now and moved behind a real cron later.
 */
export async function generateAppointmentReminders() {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const bookings = await db.booking.findMany({
    where: { status: "CONFIRMED", scheduledAt: { gte: now, lte: in24Hours } },
    include: { expert: { select: { name: true } }, client: { select: { name: true } } },
  });

  let created = 0;
  for (const booking of bookings) {
    const existing = await db.notification.findFirst({
      where: { type: "APPOINTMENT_REMINDER", relatedId: booking.id },
    });
    if (existing) continue;

    await db.notification.createMany({
      data: [
        {
          userId: booking.clientId,
          type: "APPOINTMENT_REMINDER",
          title: "تذكير بموعد استشارة",
          body: `لديك استشارة مع ${booking.expert.name} خلال أقل من ٢٤ ساعة.`,
          linkUrl: `/bookings/${booking.id}`,
          relatedId: booking.id,
        },
        {
          userId: booking.expertId,
          type: "APPOINTMENT_REMINDER",
          title: "تذكير بموعد استشارة",
          body: `لديك استشارة مع ${booking.client.name} خلال أقل من ٢٤ ساعة.`,
          linkUrl: `/bookings/${booking.id}`,
          relatedId: booking.id,
        },
      ],
    });
    created += 2;
  }

  return created;
}
