import { DashboardSidebar, type NavItem } from "@/components/dashboard/sidebar-nav";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

const NAV: NavItem[] = [
  { href: "/dashboard/client", label: t.dashboard.overview, icon: "LayoutDashboard" },
  { href: "/experts", label: t.dashboard.discoverExperts, icon: "Search" },
  { href: "/dashboard/client/consultations", label: t.dashboard.myConsultations, icon: "MessagesSquare" },
  { href: "/dashboard/client/appointments", label: t.dashboard.appointments, icon: "CalendarDays" },
  { href: "/dashboard/client/messages", label: t.dashboard.messages, icon: "Mail" },
  { href: "/dashboard/client/favorites", label: t.dashboard.favorites, icon: "Heart" },
  { href: "/dashboard/client/payments", label: t.dashboard.payments, icon: "CreditCard" },
  { href: "/dashboard/client/settings", label: t.dashboard.settings, icon: "Settings" },
];

export default async function ClientDashboardLayout({ children }: LayoutProps<"/">) {
  await requireRole("CLIENT");

  return (
    <div className="container-page flex flex-col gap-6 py-8 lg:flex-row lg:py-10">
      <DashboardSidebar items={NAV} title={t.nav.dashboard} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
