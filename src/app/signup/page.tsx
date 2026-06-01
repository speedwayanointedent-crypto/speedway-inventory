import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wrench, ArrowLeft } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";
import { APP_CONFIG } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Sign up to access the SpeedWay Anointed Enterprise dashboard.",
};

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-cyan-400 blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">{APP_CONFIG.shortName}</span>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Join the team in under a minute.
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            New staff accounts unlock the full POS, inventory, and reporting toolkit.
            Admins can promote your role later from the Users page.
          </p>
          <ul className="space-y-2 text-blue-50/90 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" /> Real-time stock & sales
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" /> Multi-shop inventory tracking
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" /> QR-coded digital receipts
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" /> Secure, audit-ready access
            </li>
          </ul>
        </div>
        <p className="relative z-10 text-sm text-blue-200">
          © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">{APP_CONFIG.shortName}</span>
          </div>
          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground">
              Already have one?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-muted" />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
