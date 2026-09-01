import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[1fr_320px] lg:py-12">
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-lg" />
        <Card className="gap-4 p-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
