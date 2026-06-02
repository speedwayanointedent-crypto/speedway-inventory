import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wrench, ArrowLeft, Sparkles, Users, Zap, Shield } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";
import { APP_CONFIG } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Sign up to access the SpeedWay Anointed Enterprise dashboard.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-800 p-10 xl:p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-indigo-400 blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-cyan-400 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-blue-300 blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight">{APP_CONFIG.shortName}</span>
            <span className="text-[10px] uppercase tracking-wider text-blue-200">Anointed Enterprise</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6 max-w-lg">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur">
            <Sparkles className="h-3 w-3 mr-1.5" /> Get started in 60 seconds
          </Badge>
          <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-tight">
            Join the team in{" "}
            <span className="bg-gradient-to-r from-cyan-200 to-blue-200 bg-clip-text text-transparent">
              under a minute.
            </span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            New staff accounts unlock the full POS, inventory, and reporting toolkit.
            Admins can promote your role later from the Users page.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[
              { icon: Users, label: "Real-time stock & sales" },
              { icon: Zap, label: "Multi-shop tracking" },
              { icon: Shield, label: "QR-coded receipts" },
              { icon: Sparkles, label: "Audit-ready access" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="bg-white/10 backdrop-blur rounded-xl p-3.5 border border-white/10 hover:bg-white/15 transition"
                >
                  <Icon className="h-4 w-4 mb-1.5 text-cyan-200" />
                  <p className="text-sm font-medium leading-tight">{f.label}</p>
                </div>
              );
            })}
          </div>
        </div>
        <p className="relative z-10 text-sm text-blue-200">
          © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
        </p>
      </div>

      <div className="flex flex-col justify-center px-5 sm:px-8 py-8 sm:py-12 lg:px-12 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Link href="/" className="lg:hidden flex items-center gap-2.5 justify-center mb-8">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
              <Wrench className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight">{APP_CONFIG.shortName}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Anointed Enterprise</span>
            </div>
          </Link>
          <div className="space-y-2 mb-8 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground">
              Already have one?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
