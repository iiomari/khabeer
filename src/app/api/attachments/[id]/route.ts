import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/session";

/**
 * Serves a file shared inside a consultation. The bytes never become a public
 * URL: every request re-checks that the caller is one of the two people in that
 * conversation, so a leaked link is worthless to anyone else.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/attachments/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  const attachment = await db.attachment.findUnique({
    where: { id },
    include: {
      message: {
        select: { conversation: { select: { clientId: true, expertId: true } } },
      },
    },
  });

  if (!attachment) return new NextResponse(null, { status: 404 });

  const conversation = attachment.message.conversation;
  if (conversation.clientId !== user.id && conversation.expertId !== user.id) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.contentType,
      "Content-Length": String(attachment.sizeBytes),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
