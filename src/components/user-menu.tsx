"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { logoutAction } from "@/server/actions/auth";
import { t } from "@/lib/i18n/ar";
import type { UserRole } from "@/lib/enums";

const ROLE_HOME: Record<UserRole, string> = {
  EXPERT: "/dashboard/expert",
  CLIENT: "/dashboard/client",
  ADMIN: "/admin",
};

const ROLE_SETTINGS: Record<UserRole, string> = {
  EXPERT: "/dashboard/expert/settings",
  CLIENT: "/dashboard/client/settings",
  ADMIN: "/admin",
};

export function UserMenu({
  name,
  email,
  role,
  avatarUrl,
}: {
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-11 gap-2 px-2" aria-label={name}>
          <UserAvatar name={name} src={avatarUrl} className="size-8" />
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-semibold">{name}</span>
          <span className="text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROLE_HOME[role]} className="gap-2">
            <LayoutDashboard className="size-4" />
            {t.nav.dashboard}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROLE_SETTINGS[role]} className="gap-2">
            <Settings className="size-4" />
            {t.dashboard.settings}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            {t.nav.logout}
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
