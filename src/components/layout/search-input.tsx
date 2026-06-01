"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  placeholder?: string;
  paramKey?: string;
}

export function SearchInput({ placeholder = "Search...", paramKey = "search" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = React.useState(params.get(paramKey) ?? "");

  React.useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (value) sp.set(paramKey, value);
      else sp.delete(paramKey);
      sp.delete("page");
      router.replace(`?${sp.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full md:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={() => setValue("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
