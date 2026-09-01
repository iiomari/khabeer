import { DashboardSidebar, type NavItem } from "@/components/dashboard/sidebar-nav";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

const NAV: NavItem[] = [
  { href: "/admin", label: t.admin.overview, icon: "LayoutDashboard" },
  { href: "/admin/experts", label: t.admin.experts, icon: "BadgeCheck" },
  { href: "/admin/users", label: t.admin.users, icon: "Users" },
  { href: "/admin/bookings", label: t.admin.bookings, icon: "CalendarDays" },
  { href: "/admin/categories", label: t.admin.categories, icon: "Tags" },
];

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  await requireRole("ADMIN");

  return (
    <div className="container-page flex flex-col gap-6 py-8 lg:flex-row lg:py-10">
      <DashboardSidebar items={NAV} title={t.admin.title} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
