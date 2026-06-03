import { Badge } from "@/components/ui/badge";
import { PackageSearch, ScanLine, Receipt, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: PackageSearch,
    title: "Add your stock",
    description:
      "Import products in bulk via CSV or add them one by one. Set wholesale tiers, low-stock thresholds, and bin locations.",
  },
  {
    step: "02",
    icon: ScanLine,
    title: "Ring up sales",
    description:
      "Search by name or code, then tap to add. Split payments across cash, MoMo, and bank — SpeedWay handles the math.",
  },
  {
    step: "03",
    icon: Receipt,
    title: "Share digital receipts",
    description:
      "Every sale gets a unique QR code. Customers can re-open, print, or share the receipt on WhatsApp in one tap.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
          >
            How it works
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            From stockroom to sale in three steps
          </h2>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            No training required. Set up in minutes, and your team will be ringing sales the same day.
          </p>
        </div>

        <ol className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <li
                key={s.step}
                className="relative flex flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-widest text-primary">
                    STEP {s.step}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
                {idx < STEPS.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-border lg:block" />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
