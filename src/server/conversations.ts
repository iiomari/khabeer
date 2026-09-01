import { db } from "@/lib/db";

export async function getConversationsForUser(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { OR: [{ clientId: userId }, { expertId: userId }] },
    orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
    include: {
      client: { select: { id: true, name: true, avatarUrl: true } },
      expert: { select: { id: true, name: true, avatarUrl: true } },
      booking: { select: { id: true, bookingRef: true, service: { select: { name: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { senderId: { not: userId }, readAt: null } } } },
    },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    bookingId: conversation.bookingId,
    bookingRef: conversation.booking.bookingRef,
    serviceName: conversation.booking.service.name,
    counterpart: conversation.clientId === userId ? conversation.expert : conversation.client,
    lastMessage: conversation.messages[0] ?? null,
    unreadCount: conversation._count.messages,
  }));
}
