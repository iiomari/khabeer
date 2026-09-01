"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { setExpertVerificationAction } from "@/server/actions/admin";
import { t } from "@/lib/i18n/ar";

export function ExpertVerificationActions({ expertProfileId }: { expertProfileId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function run(status: "VERIFIED" | "REJECTED", note?: string) {
    startTransition(async () => {
      const result = await setExpertVerificationAction(expertProfileId, status, note);
      if (result.ok) {
        toast.success(status === "VERIFIED" ? t.admin.expertVerified : t.admin.expertRejected);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" className="gap-1.5" disabled={pending}>
            <BadgeCheck className="size-4" />
            {t.admin.verify}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.verifyConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.onboarding.publishHint}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => run("VERIFIED")}>{t.admin.verify}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={pending}>
            <X className="size-4" />
            {t.admin.reject}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.rejectConfirm}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectReason">{t.admin.rejectReason}</Label>
            <Textarea
              id="rejectReason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => run("REJECTED", reason)}>
              {t.admin.reject}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
