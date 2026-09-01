"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  acceptBookingAction,
  cancelBookingAction,
  rejectBookingAction,
} from "@/server/actions/bookings";
import { t } from "@/lib/i18n/ar";

function ConfirmWithReason({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">{t.booking.reasonLabel}</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(reason)}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function BookingActions({
  bookingId,
  canRespond,
  canCancel,
}: {
  bookingId: string;
  canRespond: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? t.common.somethingWentWrong);
      }
    });
  }

  if (!canRespond && !canCancel) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canRespond ? (
        <>
          <Button
            size="lg"
            className="gap-2"
            disabled={pending}
            onClick={() => run(() => acceptBookingAction(bookingId), t.booking.accepted)}
          >
            <Check className="size-4.5" />
            {t.booking.accept}
          </Button>

          <ConfirmWithReason
            trigger={
              <Button size="lg" variant="outline" className="gap-2" disabled={pending}>
                <X className="size-4.5" />
                {t.booking.reject}
              </Button>
            }
            title={t.booking.rejectConfirmTitle}
            description={t.booking.rejectConfirmBody}
            confirmLabel={t.booking.reject}
            onConfirm={(reason) =>
              run(() => rejectBookingAction(bookingId, reason), t.booking.rejected)
            }
          />
        </>
      ) : null}

      {canCancel ? (
        <ConfirmWithReason
          trigger={
            <Button size="lg" variant="ghost" className="text-destructive" disabled={pending}>
              {t.booking.cancel}
            </Button>
          }
          title={t.booking.cancelConfirmTitle}
          description={t.booking.cancelConfirmBody}
          confirmLabel={t.booking.cancel}
          onConfirm={(reason) =>
            run(() => cancelBookingAction(bookingId, reason), t.booking.cancelled)
          }
        />
      ) : null}
    </div>
  );
}
