import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";
import { notify } from "@/server/notifications";
import { messageSchema } from "@/lib/validation";

async function loadConversation(conversationId: string, userId: string) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      client: { select: { id: true, name: true } },
      expert: { select: { id: true, name: true } },
    },
  });

  if (!conversation) return null;
  if (conversation.clientId !== userId && conversation.expertId !== userId) return null;
  return conversation;
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/conversations/[id]/messages">,
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ messages: [] }, { status: 401 });

  const { id } = await params;
  const conversation = await loadConversation(id, user.id);
  if (!conversation) return NextResponse.json({ messages: [] }, { status: 404 });

  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  await db.message.updateMany({
    where: { conversationId: id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ messages, currentUserId: user.id });
}

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/conversations/[id]/messages">,
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const conversation = await loadConversation(id, user.id);
  if (!conversation) return NextResponse.json({ ok: false }, { status: 404 });

  const payload = await request.json().catch(() => ({}));
  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const message = await db.message.create({
    data: { conversationId: id, senderId: user.id, body: parsed.data.body.trim() },
  });

  await db.conversation.update({
    where: { id },
    data: { lastMessageAt: message.createdAt },
  });

  const recipientId =
    user.id === conversation.clientId ? conversation.expertId : conversation.clientId;

  await notify({
    userId: recipientId,
    type: "NEW_MESSAGE",
    title: "رسالة جديدة",
    body: `${user.name}: ${parsed.data.body.slice(0, 80)}`,
    linkUrl: `/bookings/${conversation.bookingId}`,
    relatedId: conversation.id,
  });

  return NextResponse.json({ ok: true, message });
}
