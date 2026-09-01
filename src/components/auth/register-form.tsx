"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Briefcase, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerAction } from "@/server/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { SAUDI_CITIES } from "@/lib/constants";
import { t } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

type Role = "EXPERT" | "CLIENT";

function RoleChoice({ onSelect }: { onSelect: (role: Role) => void }) {
  const options = [
    {
      role: "EXPERT" as const,
      icon: Briefcase,
      title: t.auth.roleExpert,
      hint: t.auth.roleExpertHint,
    },
    {
      role: "CLIENT" as const,
      icon: Search,
      title: t.auth.roleClient,
      hint: t.auth.roleClientHint,
    },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-center text-base font-semibold">{t.auth.roleQuestion}</h2>
      {options.map((option) => (
        <button
          key={option.role}
          type="button"
          onClick={() => onSelect(option.role)}
          className="flex w-full items-start gap-4 rounded-xl border bg-card p-5 text-start transition-colors hover:border-primary/50 hover:bg-brand-soft/50 focus-visible:border-primary"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
            <option.icon className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{option.title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{option.hint}</span>
          </span>
          <ArrowRight className="mt-2 size-4.5 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

export function RegisterForm({ initialRole }: { initialRole?: Role }) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(initialRole ?? null);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: initialRole ?? "CLIENT",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      city: "",
      isCompany: false,
      companyName: "",
    },
  });

  const isCompany = watch("isCompany");

  function selectRole(value: Role) {
    setRole(value);
    setValue("role", value);
  }

  function onSubmit(values: RegisterInput) {
    setFormError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (result.ok) {
        router.push(result.redirectTo);
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  }

  if (!role) return <RoleChoice onSelect={selectRole} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="flex items-center justify-between rounded-lg bg-brand-soft px-4 py-3">
        <span className="text-sm font-medium">
          {role === "EXPERT" ? t.auth.roleExpert : t.auth.roleClient}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRole(null)}
          className="h-8"
        >
          {t.common.edit}
        </Button>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">{t.auth.name}</Label>
        <Input id="name" className="h-12" aria-invalid={Boolean(errors.name)} {...register("name")} />
        {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input
          id="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          className="h-12 text-start"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">
            {t.auth.phone} <span className="text-muted-foreground">({t.common.optional})</span>
          </Label>
          <Input
            id="phone"
            dir="ltr"
            inputMode="tel"
            placeholder="05XXXXXXXX"
            className="h-12 text-start"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
          {errors.phone ? <p className="text-sm text-destructive">{errors.phone.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{t.auth.city}</Label>
          <Select onValueChange={(value) => setValue("city", value)}>
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

      {role === "CLIENT" ? (
        <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="isCompany"
              checked={isCompany}
              onCheckedChange={(checked) => setValue("isCompany", checked === true)}
            />
            <Label htmlFor="isCompany" className="cursor-pointer font-normal">
              {t.auth.isCompany}
            </Label>
          </div>

          <div className={cn("space-y-2", !isCompany && "hidden")}>
            <Label htmlFor="companyName">{t.auth.companyName}</Label>
            <Input id="companyName" className="h-12" {...register("companyName")} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input
            id="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            className="h-12 text-start"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
          <Input
            id="confirmPassword"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            className="h-12 text-start"
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          ) : null}
        </div>
      </div>

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
        {pending ? t.common.loading : t.auth.registerAction}
        {!pending ? <UserPlus className="size-4.5" /> : null}
      </Button>
    </form>
  );
}
