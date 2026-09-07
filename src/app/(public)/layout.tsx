import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { getCurrentUser } from "@/server/session";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  // A signed-in visitor keeps the assistant on the public pages too, so help is
  // in the same corner everywhere rather than only inside the dashboards.
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {user ? <AssistantWidget role={user.role} /> : null}
    </>
  );
}
