import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_340px] lg:py-12">
      <div className="space-y-6">
        <Card className="gap-4 p-6">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="h-96 w-full" />
        </Card>
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
