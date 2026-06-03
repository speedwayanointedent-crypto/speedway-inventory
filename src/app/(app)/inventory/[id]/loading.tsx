import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-6 w-48 sm:h-8 sm:w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 gap-0">
            <Skeleton className="aspect-[4/3] md:aspect-auto bg-muted" />
            <div className="p-5 sm:p-6 space-y-4">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-36 sm:h-12 sm:w-44" />
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="contents">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12 justify-self-end" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-2.5 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
