import { SiteHeader } from "@/components/site-header";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { getCurrentUser } from "@/server/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // The assistant answers from the signed-in user's own data, so it only
  // appears once there is a user to scope those answers to.
  const user = await getCurrentUser();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {user ? <AssistantWidget role={user.role} /> : null}
    </>
  );
}
