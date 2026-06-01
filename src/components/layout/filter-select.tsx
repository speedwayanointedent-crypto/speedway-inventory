"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  param: string;
  value: string;
  options: Option[];
}

export function FilterSelect({ label, param, value, options }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (v: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (!v || v === "all") sp.delete(param);
    else sp.set(param, v);
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[140px] sm:w-[180px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
