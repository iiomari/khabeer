import Link from "next/link";
import { MessageSquareDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { ChatPanel } from "@/components/messages/chat-panel";
import { EmptyState } from "@/components/empty-state";
import { formatRelativeTime } from "@/lib/format";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

type ConversationSummary = {
  id: string;
  bookingId: string;
  serviceName: string;
  counterpart: { id: string; name: string; avatarUrl: string | null };
  lastMessage: { body: string; createdAt: Date } | null;
  unreadCount: number;
};

export function MessagesView({
  conversations,
  activeId,
  currentUserId,
  basePath,
}: {
  conversations: ConversationSummary[];
  activeId?: string;
  currentUserId: string;
  basePath: string;
}) {
  const active = conversations.find((conversation) => conversation.id === activeId);

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareDashed}
        title={t.messages.noConversations}
        description={t.messages.noConversationsHint}
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card className="max-h-[28rem] gap-0 overflow-y-auto p-0">
        <h2 className="border-b px-4 py-3 font-semibold">{t.messages.conversations}</h2>
        <ul className="divide-y">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`${basePath}?c=${conversation.id}`}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                  conversation.id === activeId && "bg-brand-soft/60",
                )}
              >
                <UserAvatar
                  name={conversation.counterpart.name}
                  src={conversation.counterpart.avatarUrl}
                  seed={conversation.counterpart.id}
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{conversation.counterpart.name}</span>
                    {conversation.unreadCount > 0 ? (
                      <Badge className="h-5 min-w-5 justify-center px-1.5 text-[0.7rem]">
                        {conversation.unreadCount}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {conversation.serviceName}
                  </p>
                  {conversation.lastMessage ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {conversation.lastMessage.body}
                    </p>
                  ) : null}
                  {conversation.lastMessage ? (
                    <span className="text-[0.7rem] text-muted-foreground">
                      {formatRelativeTime(conversation.lastMessage.createdAt)}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {active ? (
        <ChatPanel
          conversationId={active.id}
          currentUserId={currentUserId}
          counterpartName={active.counterpart.name}
        />
      ) : (
        <EmptyState icon={MessageSquareDashed} title={t.messages.selectConversation} />
      )}
    </div>
  );
}
