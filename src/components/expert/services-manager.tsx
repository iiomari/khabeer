"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteProfileItemAction, saveServiceAction } from "@/server/actions/expert-profile";
import { formatMinutes, formatSar } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceSar: number;
};

const EMPTY = { name: "", description: "", durationMinutes: "60", priceSar: "" };

export function ServicesManager({ services }: { services: Service[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      durationMinutes: String(service.durationMinutes),
      priceSar: String(service.priceSar),
    });
    setOpen(true);
  }

  function save() {
    startTransition(async () => {
      const result = await saveServiceAction(
        {
          ...form,
          durationMinutes: Number(form.durationMinutes),
          priceSar: Number(form.priceSar),
        },
        editingId ?? undefined,
      );

      if (result.ok) {
        toast.success(t.common.save);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteProfileItemAction("service", id);
      if (result.ok) {
        toast.success(t.common.delete);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="size-4" />
          {t.onboarding.addService}
        </Button>
      </div>

      <ul className="space-y-3">
        {services.map((service) => (
          <li key={service.id}>
            <Card className="gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                  <p className="mt-2 text-sm">
                    {formatMinutes(service.durationMinutes)} ·{" "}
                    <span className="font-bold text-primary">{formatSar(service.priceSar)}</span>
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(service)}
                    aria-label={t.common.edit}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => remove(service.id)}
                    aria-label={t.common.delete}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t.common.edit : t.onboarding.addService}</DialogTitle>
            <DialogDescription>{t.onboarding.step3Hint}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">{t.onboarding.serviceName}</Label>
              <Input
                id="service-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder={t.onboarding.serviceNamePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service-description">{t.onboarding.serviceDescription}</Label>
              <Textarea
                id="service-description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-duration">{t.onboarding.serviceDuration}</Label>
                <Select
                  value={form.durationMinutes}
                  onValueChange={(value) => setForm({ ...form, durationMinutes: value })}
                >
                  <SelectTrigger id="service-duration" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90, 120].map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {formatMinutes(minutes)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-price">{t.onboarding.servicePrice}</Label>
                <Input
                  id="service-price"
                  inputMode="numeric"
                  value={form.priceSar}
                  onChange={(event) =>
                    setForm({ ...form, priceSar: event.target.value.replace(/\D/g, "").slice(0, 5) })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? t.common.saving : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
