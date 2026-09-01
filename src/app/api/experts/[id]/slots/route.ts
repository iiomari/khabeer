import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAvailableSlots } from "@/server/availability";

export async function GET(request: Request, { params }: RouteContext<"/api/experts/[id]/slots">) {
  const { id } = await params;
  const duration = Number(new URL(request.url).searchParams.get("duration") ?? 60);

  const profile = await db.expertProfile.findUnique({
    where: { userId: id },
    select: { id: true, verificationStatus: true },
  });

  if (!profile || profile.verificationStatus !== "VERIFIED") {
    return NextResponse.json({ days: [] }, { status: 404 });
  }

  const days = await getAvailableSlots(profile.id, id, Number.isFinite(duration) ? duration : 60);

  return NextResponse.json({
    days: days.map((day) => ({
      dateKey: day.dateKey,
      date: day.date.toISOString(),
      slots: day.slots.map((slot) => ({
        startMinute: slot.startMinute,
        startsAt: slot.startsAt.toISOString(),
      })),
    })),
  });
}
