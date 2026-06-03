import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function InventoryLoading() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-10" />
              </div>
              <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-3 sm:p-3.5 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
              <div className="flex justify-between pt-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
