"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreVertical,
  Power,
  KeyRound,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  deleteUser,
  approveUser,
  rejectUser,
  changeUserRole,
} from "@/actions/admin";

type Status = "PENDING" | "ACTIVE" | "SUSPENDED";

interface UserActionsProps {
  id: string;
  name: string;
  email: string;
  isSelf: boolean;
  isActive: boolean;
  role: "ADMIN" | "STAFF";
  status: Status;
}

export function UserActions({ id, name, email, isSelf, isActive, role, status }: UserActionsProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [dialog, setDialog] = React.useState<
    | null
    | { type: "toggle" }
    | { type: "approve"; role: "ADMIN" | "STAFF" }
    | { type: "reject" }
    | { type: "role"; role: "ADMIN" | "STAFF" }
  >(null);

  const run = async (fn: () => Promise<{ success: boolean; error?: string }>, successMsg: string) => {
    setPending(true);
    try {
      const res = await fn();
      if (res.success) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(res.error || "Failed");
      }
    } finally {
      setPending(false);
      setDialog(null);
    }
  };

  const handleApprove = (chosenRole: "ADMIN" | "STAFF") => run(
    () => approveUser(id, chosenRole),
    `Approved as ${chosenRole}`
  );

  const handleReject = () => run(() => rejectUser(id), "User rejected");

  const handleToggle = () => run(() => deleteUser(id), isActive ? "User deactivated" : "User reactivated");

  const handleRoleChange = (newRole: "ADMIN" | "STAFF") => run(
    () => changeUserRole(id, newRole),
    `Role changed to ${newRole}`
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Manage {name.split(" ")[0]}</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {status === "PENDING" && (
            <>
              <DropdownMenuItem
                onClick={() => setDialog({ type: "approve", role: "STAFF" })}
                className="text-emerald-600 focus:text-emerald-600"
              >
                <UserCheck className="h-4 w-4" /> Approve as Staff
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDialog({ type: "approve", role: "ADMIN" })}
                className="text-emerald-600 focus:text-emerald-600"
              >
                <ShieldCheck className="h-4 w-4" /> Approve as Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDialog({ type: "reject" })}
                className="text-destructive focus:text-destructive"
              >
                <UserX className="h-4 w-4" /> Reject
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {status === "ACTIVE" && role === "STAFF" && (
            <DropdownMenuItem onClick={() => setDialog({ type: "role", role: "ADMIN" })}>
              <ShieldCheck className="h-4 w-4" /> Promote to Admin
            </DropdownMenuItem>
          )}
          {status === "ACTIVE" && role === "ADMIN" && !isSelf && (
            <DropdownMenuItem onClick={() => setDialog({ type: "role", role: "STAFF" })}>
              <Shield className="h-4 w-4" /> Demote to Staff
            </DropdownMenuItem>
          )}
          {status === "ACTIVE" && (
            <DropdownMenuItem disabled>
              <KeyRound className="h-4 w-4" /> Reset password
            </DropdownMenuItem>
          )}

          {status === "SUSPENDED" && (
            <DropdownMenuItem
              onClick={() => setDialog({ type: "approve", role })}
              className="text-emerald-600 focus:text-emerald-600"
            >
              <UserCheck className="h-4 w-4" /> Reactivate
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isSelf}
            className={
              isActive
                ? "text-destructive focus:text-destructive"
                : "text-emerald-600 focus:text-emerald-600"
            }
            onClick={() => setDialog({ type: "toggle" })}
          >
            <Power className="h-4 w-4" /> {isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={dialog !== null}
        onOpenChange={(o) => {
          if (!o) setDialog(null);
        }}
      >
        <DialogContent>
          {dialog?.type === "approve" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  Approve {name}?
                </DialogTitle>
                <DialogDescription>
                  Activate <strong>{email}</strong> as <strong>{dialog.role}</strong>?
                  They will receive an email and be able to sign in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                <Button onClick={() => handleApprove(dialog.role)} loading={pending}>
                  Approve as {dialog.role}
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog?.type === "reject" && (
            <>
              <DialogHeader>
                <DialogTitle>Reject {name}?</DialogTitle>
                <DialogDescription>
                  {email} will not be able to sign in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject} loading={pending}>
                  Reject
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog?.type === "role" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog.role === "ADMIN" ? "Promote" : "Demote"} {name}?
                </DialogTitle>
                <DialogDescription>
                  Their role will change to <strong>{dialog.role}</strong> with the corresponding permissions.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                <Button onClick={() => handleRoleChange(dialog.role)} loading={pending}>
                  {dialog.role === "ADMIN" ? "Promote" : "Demote"}
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog?.type === "toggle" && (
            <>
              <DialogHeader>
                <DialogTitle>{isActive ? "Deactivate" : "Activate"} user?</DialogTitle>
                <DialogDescription>
                  <strong>{name}</strong> will {isActive ? "no longer" : "be able to"} sign in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
                <Button
                  variant={isActive ? "destructive" : "default"}
                  onClick={handleToggle}
                  loading={pending}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
