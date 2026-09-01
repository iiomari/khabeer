"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createCategoryAction, deleteCategoryAction } from "@/server/actions/admin";
import { CategoryIcon } from "@/components/category-icon";
import { formatNumber } from "@/lib/format";
import { t } from "@/lib/i18n/ar";

type Category = { id: string; name: string; icon: string | null; expertCount: number };

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function create() {
    startTransition(async () => {
      const result = await createCategoryAction({ name });
      if (result.ok) {
        toast.success(t.admin.categoryAdded);
        setName("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.ok) {
        toast.success(t.admin.categoryDeleted);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="gap-3 p-5">
        <Label htmlFor="categoryName">{t.admin.categoryName}</Label>
        <div className="flex gap-2">
          <Input
            id="categoryName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11"
            onKeyDown={(event) => {
              if (event.key === "Enter" && name.trim().length >= 2) {
                event.preventDefault();
                create();
              }
            }}
          />
          <Button
            className="h-11 gap-1.5"
            onClick={create}
            disabled={pending || name.trim().length < 2}
          >
            <Plus className="size-4" />
            {t.admin.addCategory}
          </Button>
        </div>
      </Card>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Card className="flex-row items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-primary">
                  <CategoryIcon name={category.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(category.expertCount)} {t.admin.experts}
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    aria-label={`${t.common.delete} ${category.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.admin.deleteCategoryConfirm}</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove(category.id)}>
                      {t.common.delete}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
