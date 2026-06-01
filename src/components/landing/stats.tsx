import { Package, ShoppingCart, Users, Zap } from "lucide-react";

const STATS = [
  {
    icon: Package,
    value: "10,000+",
    label: "Parts tracked daily",
  },
  {
    icon: ShoppingCart,
    value: "< 8s",
    label: "Average checkout time",
  },
  {
    icon: Users,
    value: "500+",
    label: "Trusted dealers",
  },
  {
    icon: Zap,
    value: "99.9%",
    label: "Uptime guaranteed",
  },
];

export function Stats() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
