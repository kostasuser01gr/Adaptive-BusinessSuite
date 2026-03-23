import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between mb-6">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[140px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`rounded-xl ${i < 2 ? "col-span-1" : i === 2 ? "col-span-2" : "col-span-1"}`}
          />
        ))}
      </div>
    </div>
  );
}
