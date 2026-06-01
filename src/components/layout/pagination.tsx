"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  totalPages: number;
  total: number;
}

export function Pagination({ page, totalPages, total }: Props) {
  const pathname = usePathname();
  const params = useSearchParams();
  const makeHref = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    return `${pathname}?${sp.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mt-4 text-sm">
      <p className="text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of {totalPages} ·{" "}
        {total} items
      </p>
      <div className="flex gap-1">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link href={makeHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>
            <ChevronLeft className="h-3 w-3" /> Prev
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
          <Link href={makeHref(Math.min(totalPages, page + 1))}>
            Next <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
