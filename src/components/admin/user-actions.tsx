"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, Power, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteUser } from "@/actions/admin";

export function UserActions({ id, name, isSelf, isActive }: { id: string; name: string; isSelf: boolean; isActive: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleToggle = async () => {
    setPending(true);
    try {
      const res = await deleteUser(id);
      if (res.success) {
        toast.success(isActive ? "User deactivated" : "User reactivated");
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setPending(false);
      setOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>
            <KeyRound className="h-4 w-4" /> Reset password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isSelf}
            className={isActive ? "text-destructive focus:text-destructive" : "text-success focus:text-success"}
            onClick={() => setOpen(true)}
          >
            <Power className="h-4 w-4" /> {isActive ? "Deactivate" : "Reactivate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isActive ? "Deactivate" : "Reactivate"} user?</DialogTitle>
            <DialogDescription>
              <strong>{name}</strong> will {isActive ? "no longer be able to sign in" : "be able to sign in again"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={handleToggle}
              loading={pending}
            >
              {isActive ? "Deactivate" : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
