"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Cta() {
  return (
    <section id="contact" className="relative overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10 px-6 py-16 sm:px-12 sm:py-20">
          {/* Background pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
              backgroundSize: "24px 24px",
              maskImage:
                "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
            }}
          />
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

          <div className="relative mx-auto max-w-2xl text-center">
            <Badge
              variant="secondary"
              className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Ready when you are
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              Take your shop online — without the chaos
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Sign in with your staff credentials, or talk to the team at SpeedWay
              Anointed Enterprise to get your business set up.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group h-11 w-full sm:w-auto px-7 shadow-lg shadow-primary/25"
              >
                <Link href="/login">
                  Sign in to dashboard
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 w-full sm:w-auto px-7 bg-background/60 backdrop-blur"
              >
                <a href="mailto:speedwayanointedent@gmail.com">Contact the team</a>
              </Button>
            </div>
            <div className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>SOC2-style security · encrypted at rest · daily backups</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
