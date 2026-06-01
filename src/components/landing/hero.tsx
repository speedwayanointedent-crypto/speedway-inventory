"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Package,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroBackground } from "./hero-background";
import { APP_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PILL_FEATURES = [
  "Real-time stock tracking",
  "WhatsApp-ready receipts",
  "Multi-user roles",
];

export function Hero() {
  const mounted = true;

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32">
      <HeroBackground />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="secondary"
            className={cn(
              "mb-6 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur transition-all duration-700",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Built for wholesale spare-parts dealers in Ghana</span>
          </Badge>

          <h1
            className={cn(
              "text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl transition-all duration-700 delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            Run your spare-parts shop{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-br from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                at full throttle
              </span>
              <svg
                aria-hidden
                viewBox="0 0 418 42"
                className="absolute left-0 top-full h-[0.55em] w-full text-primary/40"
                preserveAspectRatio="none"
              >
                <path
                  d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </h1>

          <p
            className={cn(
              "mx-auto mt-7 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg transition-all duration-700 delay-200",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            The all-in-one inventory and point-of-sale platform built for {APP_CONFIG.shortName}.
            Track every part, ring up sales in seconds, and keep customers coming back with
            QR-coded digital receipts.
          </p>

          <div
            className={cn(
              "mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row transition-all duration-700 delay-300",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            )}
          >
            <Button
              asChild
              size="lg"
              className="group h-11 w-full sm:w-auto px-7 shadow-lg shadow-primary/25"
            >
              <Link href="/login">
                Open the dashboard
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 w-full sm:w-auto px-7 bg-background/60 backdrop-blur"
            >
              <a href="#features">See features</a>
            </Button>
          </div>

          <ul
            className={cn(
              "mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground transition-all duration-700 delay-500",
              mounted ? "opacity-100" : "opacity-0",
            )}
          >
            {PILL_FEATURES.map((f) => (
              <li key={f} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dashboard preview */}
        <div
          className={cn(
            "relative mx-auto mt-16 max-w-6xl transition-all duration-1000 delay-300 sm:mt-20",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          )}
        >
          <div className="absolute -inset-x-12 -top-12 -bottom-12 -z-10 bg-gradient-to-tr from-primary/15 via-blue-500/10 to-purple-500/15 blur-3xl" />
          <DashboardMockup />
        </div>

        {/* Trust strip */}
        <div
          className={cn(
            "mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-muted-foreground/60 transition-all duration-700 delay-700",
            mounted ? "opacity-100" : "opacity-0",
          )}
        >
          <span>Trusted workflows for</span>
          <span className="font-semibold text-foreground/70">Auto Parts</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="font-semibold text-foreground/70">Workshops</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="font-semibold text-foreground/70">Wholesalers</span>
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="font-semibold text-foreground/70">Retailers</span>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative rounded-2xl border border-border/60 bg-background/60 p-2 shadow-2xl shadow-black/10 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5">
      <div className="rounded-xl border border-border/60 bg-card">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="hidden sm:flex h-7 flex-1 mx-6 items-center justify-center rounded-md bg-muted/60 text-[11px] text-muted-foreground">
            {APP_CONFIG.url.replace(/^https?:\/\//, "")}/dashboard
          </div>
          <div className="text-[11px] font-medium text-muted-foreground">Live</div>
        </div>

        <div className="grid grid-cols-12 gap-0">
          {/* Sidebar */}
          <div className="hidden md:flex col-span-2 flex-col gap-1 border-r border-border/60 p-3">
            {["Dashboard", "Inventory", "Sales / POS", "Customers", "Reports"].map((l, i) => (
              <div
                key={l}
                className={
                  "rounded-md px-2.5 py-1.5 text-[11px] font-medium " +
                  (i === 0
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {l}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="col-span-12 md:col-span-10 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Welcome back</div>
                <div className="mt-0.5 text-base font-semibold tracking-tight">Today at a glance</div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-[10px] font-medium">
                  Last 30 days
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                icon={<BarChart3 className="h-3.5 w-3.5" />}
                label="Revenue"
                value="GH₵ 12,480"
                delta="+18.2%"
              />
              <StatCard
                icon={<Receipt className="h-3.5 w-3.5" />}
                label="Sales today"
                value="42"
                delta="+6"
              />
              <StatCard
                icon={<Package className="h-3.5 w-3.5" />}
                label="SKUs in stock"
                value="1,284"
                delta="92 healthy"
              />
              <StatCard
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                label="Low stock"
                value="7"
                delta="Action needed"
                danger
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex items-center justify-between pb-2">
                  <div className="text-[11px] font-semibold">Sales trend</div>
                  <div className="text-[10px] text-muted-foreground">30d</div>
                </div>
                <ChartGraphic />
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex items-center justify-between pb-2">
                  <div className="text-[11px] font-semibold">Top sellers</div>
                  <div className="text-[10px] text-muted-foreground">Today</div>
                </div>
                <ul className="space-y-1.5">
                  {[
                    ["Brake pad set", "GH₵ 1,240"],
                    ["Engine oil 5L", "GH₵ 980"],
                    ["Air filter", "GH₵ 740"],
                    ["Spark plug x4", "GH₵ 520"],
                  ].map(([name, v]) => (
                    <li
                      key={name}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="text-foreground/80">{name}</span>
                      <span className="font-medium tabular-nums text-foreground">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  delta,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-primary">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tabular-nums tracking-tight">{value}</div>
      <div
        className={
          "mt-0.5 text-[10px] font-medium " +
          (danger ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400")
        }
      >
        {delta}
      </div>
    </div>
  );
}

function ChartGraphic() {
  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 300 120" className="h-full w-full">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="text-primary">
          <path
            d="M0,90 C30,80 50,70 75,68 C100,66 120,80 150,60 C180,40 200,55 230,35 C260,18 280,28 300,22 L300,120 L0,120 Z"
            fill="url(#g)"
          />
          <path
            d="M0,90 C30,80 50,70 75,68 C100,66 120,80 150,60 C180,40 200,55 230,35 C260,18 280,28 300,22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <g className="text-muted-foreground/40">
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="0"
              x2="300"
              y1={20 + i * 25}
              y2={20 + i * 25}
              stroke="currentColor"
              strokeDasharray="2 4"
            />
          ))}
        </g>
      </svg>
      <div className="absolute right-2 top-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
        ▲ 18.2%
      </div>
    </div>
  );
}
