import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { APP_CONFIG } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your SpeedWay Anointed Enterprise account",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
            <Wrench className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">{APP_CONFIG.shortName}</span>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Wholesale spare parts inventory & POS, built for performance.
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Track inventory, process sales, manage customers, and generate professional receipts —
            all from one beautifully crafted dashboard.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-8">
            {[
              { label: "Real-time" },
              { label: "Secure" },
              { label: "Audit ready" },
            ].map((f) => (
              <div key={f.label} className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10">
                <p className="text-sm font-medium">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-sm text-blue-200">
          © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Wrench className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">{APP_CONFIG.shortName}</span>
          </div>
          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
