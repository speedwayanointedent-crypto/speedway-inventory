"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/actions/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    startTransition(async () => {
      const res = await resetPassword(token, form.password);
      if (res.success) {
        setDone(true);
        toast.success("Password reset! Redirecting...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error(res.error || "Reset failed");
      }
    });
  }

  if (!token) {
    return (
      <p className="text-sm text-destructive">
        Invalid or missing token. Use the link from your reset email.
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="h-10 w-10 mx-auto text-success" />
        <p className="font-semibold mt-2">Password reset</p>
        <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          minLength={8}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type="password"
          minLength={8}
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Reset password
      </Button>
    </form>
  );
}
