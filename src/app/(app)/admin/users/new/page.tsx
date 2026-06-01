"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createUser } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/page-header";
import { ROLES, ROLE_PERMISSIONS } from "@/lib/constants";

export default function NewUserPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "ADMIN" | "STAFF";
    isActive: boolean;
  }>({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: ROLES.STAFF,
    isActive: true,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUser({
        ...form,
        permissions: ROLE_PERMISSIONS[form.role],
      });
      if (res.success) {
        toast.success("User invited");
        router.push("/admin/users");
      } else {
        toast.error(res.error || "Failed");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/admin/users">
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
      </Button>
      <PageHeader title="Invite User" description="Create a new admin or staff account" />
      <form onSubmit={submit}>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Initial Password *</Label>
                <Input
                  id="password"
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <div className="flex gap-2">
                {Object.values(ROLES).map((r) => (
                  <Button
                    key={r}
                    type="button"
                    variant={form.role === r ? "default" : "outline"}
                    onClick={() => update("role", r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.role === ROLES.ADMIN
                  ? "Full access to every module."
                  : "Limited access (POS, customers, view inventory/reports)."}
              </p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div>
                <Label htmlFor="active">Account active</Label>
                <p className="text-xs text-muted-foreground">Inactive users cannot sign in.</p>
              </div>
              <Switch
                id="active"
                checked={form.isActive}
                onCheckedChange={(v) => update("isActive", v)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/users">Cancel</Link>
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Invite
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
