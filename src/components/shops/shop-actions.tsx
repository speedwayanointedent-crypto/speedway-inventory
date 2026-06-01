"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Power, MapPin, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { deleteShop, updateShop } from "@/actions/shops";
import Link from "next/link";

interface Props {
  shop: { _id: string; name: string; isActive: boolean; isDefault: boolean };
}

export function ShopActions({ shop }: Props) {
  const [pending, start] = useTransition();

  const onToggle = () => {
    start(async () => {
      const res = await updateShop(shop._id, { isActive: !shop.isActive });
      if (res.success) {
        toast.success(shop.isActive ? "Shop deactivated" : "Shop activated");
      } else {
        toast.error("error" in res && res.error ? res.error : "Failed");
      }
    });
  };

  const onDelete = () => {
    if (!confirm(`Deactivate "${shop.name}"?`)) return;
    start(async () => {
      const res = await deleteShop(shop._id);
      if (res.success) {
        toast.success("Shop deactivated");
      } else {
        toast.error("error" in res && res.error ? res.error : "Failed");
      }
    });
  };

  const onMakeDefault = () => {
    start(async () => {
      const res = await updateShop(shop._id, { isDefault: true });
      if (res.success) {
        toast.success(`${shop.name} is now the default shop`);
      } else {
        toast.error("error" in res && res.error ? res.error : "Failed");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/admin/shops/${shop._id}/edit`}>
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </DropdownMenuItem>
        {!shop.isDefault && (
          <DropdownMenuItem onClick={onMakeDefault}>
            <Star className="h-4 w-4" /> Make default
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggle}>
          <Power className="h-4 w-4" /> {shop.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
          disabled={shop.isDefault}
        >
          <MapPin className="h-4 w-4" /> Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
