import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_360px] lg:py-12">
      <div className="space-y-6">
        <Card className="gap-5 p-6">
          <div className="flex gap-5">
            <Skeleton className="size-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </Card>
        <Card className="gap-3 p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full" />
        </Card>
        <Card className="gap-3 p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
