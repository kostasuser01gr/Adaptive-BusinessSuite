import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="w-full rounded-lg" style={{ height }} />
    </div>
  );
}
