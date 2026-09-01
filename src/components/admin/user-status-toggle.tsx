"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleUserStatusAction } from "@/server/actions/admin";
import { t } from "@/lib/i18n/ar";

export function UserStatusToggle({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isActive = status === "ACTIVE";

  function toggle() {
    startTransition(async () => {
      const result = await toggleUserStatusAction(userId);
      if (result.ok) {
        toast.success(isActive ? t.admin.userSuspended : t.admin.userActivated);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      size="sm"
      variant={isActive ? "outline" : "default"}
      className="gap-1.5"
      onClick={toggle}
      disabled={pending}
    >
      {isActive ? <Ban className="size-4" /> : <CircleCheck className="size-4" />}
      {isActive ? t.admin.suspend : t.admin.activate}
    </Button>
  );
}
