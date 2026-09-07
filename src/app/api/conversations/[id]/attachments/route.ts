import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { notify } from "@/server/notifications";
import { t } from "@/lib/i18n/ar";

/** Kept modest on purpose: these are documents and photos, not video. */
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/conversations/[id]/attachments">,
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const conversation = await db.conversation.findUnique({
    where: { id },
    select: { id: true, clientId: true, expertId: true, bookingId: true },
  });

  if (!conversation) return NextResponse.json({ ok: false }, { status: 404 });
  if (conversation.clientId !== user.id && conversation.expertId !== user.id) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: t.messages.attachmentMissing }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: t.messages.attachmentTooLarge }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ ok: false, error: t.messages.attachmentType }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const caption = String(form?.get("body") ?? "").trim();

  // The message and its file are written together: a message row pointing at a
  // file that failed to save would render as a broken attachment forever.
  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        body: caption || file.name,
        attachmentName: file.name,
        attachmentType: file.type,
        attachmentSize: file.size,
      },
    });

    const attachment = await tx.attachment.create({
      data: {
        messageId: created.id,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        data: bytes,
      },
      select: { id: true },
    });

    return tx.message.update({
      where: { id: created.id },
      data: { attachmentUrl: `/api/attachments/${attachment.id}` },
    });
  });

  await db.conversation.update({ where: { id }, data: { lastMessageAt: message.createdAt } });

  const recipientId = user.id === conversation.clientId ? conversation.expertId : conversation.clientId;
  await notify({
    userId: recipientId,
    type: "NEW_MESSAGE",
    title: "مرفق جديد",
    body: `${user.name} أرسل ملفًا: ${file.name}`,
    linkUrl: `/bookings/${conversation.bookingId}`,
    relatedId: conversation.id,
  });

  return NextResponse.json({ ok: true, message });
}
