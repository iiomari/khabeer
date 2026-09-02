import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";
import { NafathButton } from "@/components/auth/nafath-button";
import { t } from "@/lib/i18n/ar";

export const metadata: Metadata = {
  title: t.auth.registerTitle,
  description: t.auth.registerSubtitle,
};

export default async function RegisterPage({ searchParams }: PageProps<"/auth/register">) {
  const params = await searchParams;
  const roleParam = params.role === "EXPERT" || params.role === "CLIENT" ? params.role : undefined;

  return (
    <div className="w-full max-w-lg">
      <Card className="p-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.auth.registerTitle}</CardTitle>
          <CardDescription className="text-base">{t.auth.registerSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <NafathButton />
          <RegisterForm initialRole={roleParam} />
          <p className="text-center text-sm text-muted-foreground">
            {t.auth.hasAccount}{" "}
            <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              {t.auth.loginAction}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
