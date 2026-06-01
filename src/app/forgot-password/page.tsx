import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ArrowLeft, Wrench } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
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
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
