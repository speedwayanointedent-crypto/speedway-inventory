"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Save, Loader2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export function ProfileClient({
  user,
  onUpdate,
}: {
  user: {
    _id?: string;
    name: string;
    email: string;
    phone?: string;
    role: "ADMIN" | "STAFF";
    isActive?: boolean;
    lastLogin?: string;
    createdAt?: string;
  };
  onUpdate: (data: { name: string; phone: string }) => Promise<{ success: boolean; error?: string }>;
}) {
  const { update } = useSession();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await onUpdate(form);
      if (res.success) {
        toast.success("Profile updated");
        await update();
      } else {
        toast.error(res.error || "Update failed");
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title="My Profile" description="Manage your account" icon={UserIcon} />
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-lg">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
              {user.lastLogin && (
                <span className="text-xs text-muted-foreground">
                  Last sign in: {formatDate(user.lastLogin, true)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={submit}>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
