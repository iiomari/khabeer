import { DashboardSidebar, type NavItem } from "@/components/dashboard/sidebar-nav";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

const NAV: NavItem[] = [
  { href: "/dashboard/expert", label: t.dashboard.overview, icon: "LayoutDashboard" },
  { href: "/dashboard/expert/profile", label: t.dashboard.myProfile, icon: "UserRound" },
  { href: "/dashboard/expert/services", label: t.dashboard.myServices, icon: "Briefcase" },
  { href: "/dashboard/expert/consultations", label: t.dashboard.consultations, icon: "MessagesSquare" },
  { href: "/dashboard/expert/appointments", label: t.dashboard.appointments, icon: "CalendarDays" },
  { href: "/dashboard/expert/messages", label: t.dashboard.messages, icon: "Mail" },
  { href: "/dashboard/expert/earnings", label: t.dashboard.earnings, icon: "Wallet" },
  { href: "/dashboard/expert/reviews", label: t.dashboard.reviews, icon: "Star" },
  { href: "/dashboard/expert/rewards", label: t.rewards.title, icon: "Medal" },
  { href: "/dashboard/expert/settings", label: t.dashboard.settings, icon: "Settings" },
];

export default async function ExpertDashboardLayout({ children }: LayoutProps<"/">) {
  await requireRole("EXPERT");

  return (
    <div className="container-page flex flex-col gap-6 py-8 lg:flex-row lg:py-10">
      <DashboardSidebar items={NAV} title={t.nav.dashboard} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
