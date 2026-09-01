import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = {
  title: t.auth.loginTitle,
  description: t.auth.loginSubtitle,
};

const DEMO_ACCOUNTS = [
  { label: "خبير", email: "abdullah@khabeer.sa" },
  { label: "عميل", email: "ahmed@mada-solutions.sa" },
  { label: "مشرف", email: "admin@khabeer.sa" },
];

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-4">
      <Card className="p-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.auth.loginTitle}</CardTitle>
          <CardDescription className="text-base">{t.auth.loginSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            {t.auth.noAccount}{" "}
            <Link href="/auth/register" className="font-semibold text-primary hover:underline">
              {t.auth.registerAction}
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card className="gap-3 border-dashed bg-muted/40 p-5">
        <h2 className="text-sm font-semibold">{t.auth.demoAccounts}</h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email} className="flex items-center justify-between gap-2">
              <span>{account.label}</span>
              <code dir="ltr" className="rounded bg-background px-2 py-0.5 text-xs">
                {account.email}
              </code>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          كلمة المرور للجميع: <code dir="ltr">Khabeer@123</code>
        </p>
      </Card>
    </div>
  );
}
