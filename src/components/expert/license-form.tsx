"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, BadgeCheck, ShieldAlert, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { submitLicenseAction } from "@/server/actions/license";
import { t } from "@/lib/i18n/ar";
import type { LicenseStatus } from "@/lib/enums";

const STATUS_LABEL: Record<LicenseStatus, string> = {
  NOT_REQUIRED: t.license.statusNotRequired,
  MISSING: t.license.statusMissing,
  PENDING: t.license.statusPending,
  APPROVED: t.license.statusApproved,
  REJECTED: t.license.statusRejected,
};

const STATUS_TONE: Record<LicenseStatus, string> = {
  NOT_REQUIRED: "bg-muted text-muted-foreground",
  MISSING: "bg-destructive/12 text-destructive",
  PENDING: "bg-warning/15 text-warning-foreground",
  APPROVED: "bg-success/12 text-success",
  REJECTED: "bg-destructive/12 text-destructive",
};

export function LicenseForm({
  status,
  regulated,
  fieldNames,
  licenseNumber,
  licenseIssuer,
  licenseExpiry,
  licenseDocUrl,
  rejectionReason,
}: {
  status: LicenseStatus;
  regulated: boolean;
  fieldNames: string[];
  licenseNumber?: string | null;
  licenseIssuer?: string | null;
  /** yyyy-mm-dd, already formatted for the date input by the server. */
  licenseExpiry?: string | null;
  licenseDocUrl?: string | null;
  rejectionReason?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // Nothing to ask for when none of the expert's fields is regulated.
  if (!regulated) return null;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await submitLicenseAction({
        licenseNumber: String(form.get("licenseNumber") ?? ""),
        licenseIssuer: String(form.get("licenseIssuer") ?? ""),
        licenseExpiry: String(form.get("licenseExpiry") ?? ""),
        licenseDocUrl: String(form.get("licenseDocUrl") ?? ""),
      });

      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card className="gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-lg font-bold">
            {status === "APPROVED" ? (
              <ShieldCheck className="size-5 text-success" />
            ) : (
              <ShieldAlert className="size-5 text-accent" />
            )}
            {t.license.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.license.regulatedHint}</p>
        </div>
        <Badge className={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t.license.regulatedField}:</span>
        {fieldNames.map((field) => (
          <Badge key={field} variant="outline" className="font-normal">
            {field}
          </Badge>
        ))}
      </div>

      {status === "REJECTED" && rejectionReason ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{rejectionReason}</AlertDescription>
        </Alert>
      ) : null}

      {saved ? (
        <Alert>
          <BadgeCheck />
          <AlertDescription>{t.license.submitted}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">{t.license.number}</Label>
          <Input
            id="licenseNumber"
            name="licenseNumber"
            dir="ltr"
            defaultValue={licenseNumber ?? ""}
            className="h-12 text-start"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseIssuer">{t.license.issuer}</Label>
          <Input
            id="licenseIssuer"
            name="licenseIssuer"
            defaultValue={licenseIssuer ?? ""}
            className="h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseExpiry">{t.license.expiry}</Label>
          <Input
            id="licenseExpiry"
            name="licenseExpiry"
            type="date"
            dir="ltr"
            defaultValue={licenseExpiry ?? ""}
            className="h-12 text-start"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseDocUrl">
            {t.license.document}{" "}
            <span className="text-muted-foreground">({t.common.optional})</span>
          </Label>
          <Input
            id="licenseDocUrl"
            name="licenseDocUrl"
            dir="ltr"
            placeholder="https://…"
            defaultValue={licenseDocUrl ?? ""}
            className="h-12 text-start"
          />
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" size="lg" className="h-12" disabled={pending}>
            {pending ? t.common.saving : t.license.submit}
            {!pending ? <Upload className="size-4.5" /> : null}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">{t.license.documentHint}</p>
        </div>
      </form>
    </Card>
  );
}
