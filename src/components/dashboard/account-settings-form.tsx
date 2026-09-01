"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAccountAction } from "@/server/actions/account";
import { SAUDI_CITIES } from "@/lib/constants";
import { t } from "@/lib/i18n/ar";

export function AccountSettingsForm({
  defaultValues,
}: {
  defaultValues: { name: string; phone: string; city: string; email: string };
}) {
  const router = useRouter();
  const [values, setValues] = useState(defaultValues);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateAccountAction({
        name: values.name,
        phone: values.phone,
        city: values.city,
      });

      if (result.ok) {
        toast.success(t.dashboard.profileUpdated);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">{t.auth.name}</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" value={values.email} dir="ltr" disabled className="h-12 text-start" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{t.auth.phone}</Label>
          <Input
            id="phone"
            dir="ltr"
            placeholder="05XXXXXXXX"
            value={values.phone}
            onChange={(event) => setValues({ ...values, phone: event.target.value })}
            className="h-12 text-start"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{t.auth.city}</Label>
          <Select
            value={values.city || undefined}
            onValueChange={(value) => setValues({ ...values, city: value })}
          >
            <SelectTrigger id="city" className="h-12 w-full">
              <SelectValue placeholder={t.discovery.anyCity} />
            </SelectTrigger>
            <SelectContent>
              {SAUDI_CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.common.saving : t.dashboard.updateProfile}
      </Button>
    </form>
  );
}
