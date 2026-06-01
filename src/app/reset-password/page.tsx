import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ArrowLeft, Wrench } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">{APP_CONFIG.shortName}</span>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl font-bold">Set a new password</h1>
            <p className="text-sm text-muted-foreground">Choose a strong password to secure your account.</p>
          </div>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-md bg-muted" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
