"use client";

import {
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Bell,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  category: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    icon: Package,
    title: "Smart inventory",
    description:
      "Track every SKU, batch, and bin with real-time stock counts, low-stock alerts, and full audit history.",
    category: "Inventory",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    icon: ShoppingCart,
    title: "Lightning POS",
    description:
      "Scan, search, and check out in seconds. Split payments across cash, MoMo, and bank with automatic tax.",
    category: "Point of Sale",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: QrCode,
    title: "Digital receipts",
    description:
      "Auto-generate scannable QR receipts customers can re-open, print, or share via WhatsApp — no paper needed.",
    category: "Receipts",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Insightful reports",
    description:
      "Sales, profit, inventory turnover, and staff performance — export to PDF, Excel, or CSV in one click.",
    category: "Analytics",
    accent: "from-amber-500 to-orange-500",
  },
  {
    icon: Truck,
    title: "Stock in / out",
    description:
      "Receive purchase orders, run stock-takes, log damages, and process returns — all without leaving the app.",
    category: "Operations",
    accent: "from-indigo-500 to-blue-500",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description:
      "Granular permissions for admins and staff. Audit logs capture every change for total accountability.",
    category: "Security",
    accent: "from-slate-500 to-zinc-500",
  },
  {
    icon: Bell,
    title: "Smart alerts",
    description:
      "Get notified the moment a part runs low, a sale completes, or an unusual pattern appears in your data.",
    category: "Notifications",
    accent: "from-yellow-500 to-amber-500",
  },
  {
    icon: Smartphone,
    title: "Mobile-first PWA",
    description:
      "Install on any device, work offline, and use it at the counter, in the warehouse, or on the road.",
    category: "Platform",
    accent: "from-cyan-500 to-sky-500",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Everything you need
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Built for the way you actually work
          </h2>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            From the moment stock arrives to the second a customer leaves with a receipt,
            SpeedWay keeps every moving part in sync.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-border hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5">
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${feature.accent} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-25`}
      />
      <div className="relative">
        <div
          className={`inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${feature.accent} text-white shadow-md`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="mt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {feature.category}
        </div>
        <h3 className="mt-1.5 text-lg font-semibold tracking-tight">{feature.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {feature.description}
        </p>
      </div>
    </div>
  );
}
