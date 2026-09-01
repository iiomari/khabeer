import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { UserStatusToggle } from "@/components/admin/user-status-toggle";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.admin.users };

export default async function AdminUsersPage() {
  const admin = await requireRole("ADMIN");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      city: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.admin.users}</h1>
      </header>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.auth.name}</TableHead>
                <TableHead>{t.admin.role}</TableHead>
                <TableHead>{t.auth.city}</TableHead>
                <TableHead>{t.admin.joinedAt}</TableHead>
                <TableHead>{t.booking.status}</TableHead>
                <TableHead className="text-end">{t.common.edit}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} src={user.avatarUrl} seed={user.id} className="size-9" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.name}</p>
                        <p dir="ltr" className="truncate text-start text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t.admin.roles[user.role as keyof typeof t.admin.roles]}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.city ?? "—"}</TableCell>
                  <TableCell>{formatShortDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "ACTIVE" ? "outline" : "destructive"}>
                      {user.status === "ACTIVE" ? t.admin.active : t.admin.suspended}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    {user.id === admin.id ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <UserStatusToggle userId={user.id} status={user.status} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
