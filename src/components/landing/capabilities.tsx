import { Badge } from "@/components/ui/badge";
import {
  Cloud,
  Wifi,
  Lock,
  Languages,
  Layers,
  LineChart,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: Cloud,
    title: "Cloud-synced",
    description: "Your data lives in the cloud, safe and accessible from any device.",
  },
  {
    icon: Wifi,
    title: "Offline-ready",
    description: "Keep selling even when the network drops. We sync the moment you reconnect.",
  },
  {
    icon: Lock,
    title: "Bank-grade security",
    description: "Encrypted at rest, encrypted in transit, role-based access everywhere.",
  },
  {
    icon: Languages,
    title: "Local-first",
    description: "Built for Ghana — cedis, MoMo, and the way you actually do business.",
  },
  {
    icon: Layers,
    title: "Open API",
    description: "Connect to your accounting, e-commerce, or shipping tools with our REST API.",
  },
  {
    icon: LineChart,
    title: "Live dashboards",
    description: "See top sellers, low stock, and daily revenue as they happen.",
  },
];

export function Capabilities() {
  return (
    <section className="relative bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
          >
            Capabilities
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Everything else, built in
          </h2>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            The unglamorous things that make a real business run — already done, no extra setup.
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-sm ring-1 ring-border/60">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight">{c.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {c.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
