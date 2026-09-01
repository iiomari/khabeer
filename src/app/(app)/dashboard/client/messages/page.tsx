import type { Metadata } from "next";
import { MessagesView } from "@/components/messages/messages-view";
import { getConversationsForUser } from "@/server/conversations";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.messages.title };

export default async function ClientMessagesPage({
  searchParams,
}: PageProps<"/dashboard/client/messages">) {
  const user = await requireRole("CLIENT");
  const query = await searchParams;
  const activeId = Array.isArray(query.c) ? query.c[0] : query.c;

  const conversations = await getConversationsForUser(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.messages.title}</h1>
      </header>

      <MessagesView
        conversations={conversations}
        activeId={activeId ?? conversations[0]?.id}
        currentUserId={user.id}
        basePath="/dashboard/client/messages"
      />
    </div>
  );
}
