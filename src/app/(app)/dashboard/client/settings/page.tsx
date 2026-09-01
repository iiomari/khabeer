import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { AccountSettingsForm } from "@/components/dashboard/account-settings-form";
import { db } from "@/lib/db";
import { requireRole } from "@/server/session";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = { title: t.dashboard.settings };

export default async function ClientSettingsPage() {
  const sessionUser = await requireRole("CLIENT");
  const user = await db.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    select: { name: true, email: true, phone: true, city: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">{t.dashboard.accountSettings}</h1>
      </header>

      <Card className="p-6">
        <AccountSettingsForm
          defaultValues={{
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
            city: user.city ?? "",
          }}
        />
      </Card>
    </div>
  );
}
