import { ExpertGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-10 lg:py-14">
      <PageHeaderSkeleton />
      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <Skeleton className="hidden h-[32rem] w-full rounded-xl lg:block" />
        <ExpertGridSkeleton count={6} />
      </div>
    </div>
  );
}
