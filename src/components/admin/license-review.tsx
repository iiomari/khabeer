"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ExternalLink, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reviewLicenseAction } from "@/server/actions/license";
import { formatShortDate } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

/**
 * Shown only for experts working in a regulated field. Approving the licence is
 * what actually unlocks booking for them, so it sits next to — not inside — the
 * profile verification decision.
 */
export function LicenseReview({
  expertProfileId,
  status,
  fieldNames,
  licenseNumber,
  licenseIssuer,
  licenseExpiry,
  licenseDocUrl,
}: {
  expertProfileId: string;
  status: string;
  fieldNames: string[];
  licenseNumber?: string | null;
  licenseIssuer?: string | null;
  licenseExpiry?: string | null;
  licenseDocUrl?: string | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(approve: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await reviewLicenseAction(expertProfileId, approve, reason || undefined);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  const submitted = Boolean(licenseNumber);

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck className="size-4 text-accent" />
          {t.license.adminReview}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {fieldNames.map((field) => (
            <Badge key={field} variant="outline" className="text-xs font-normal">
              {field}
            </Badge>
          ))}
        </div>
      </div>

      {submitted ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">{t.license.number}</dt>
            <dd dir="ltr" className="text-start font-medium">
              {licenseNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t.license.issuer}</dt>
            <dd className="font-medium">{licenseIssuer}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t.license.expiry}</dt>
            <dd className="font-medium">
              {licenseExpiry ? formatShortDate(licenseExpiry) : "—"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{t.license.statusMissing}</p>
      )}

      {licenseDocUrl ? (
        <a
          href={licenseDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {t.license.document}
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}

      {error ? (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {submitted && status !== "APPROVED" ? (
        <div className="mt-3 space-y-2">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t.license.rejectReason}
            className="h-11"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => decide(true)} disabled={pending}>
              <ShieldCheck className="size-4" />
              {t.license.approve}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => decide(false)}
              disabled={pending || !reason.trim()}
            >
              <ShieldX className="size-4" />
              {t.license.reject}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
