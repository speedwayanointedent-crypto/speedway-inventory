import { PackagePlus, ShoppingCart, LineChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    n: "01",
    title: "Stock what you sell",
    description:
      "Add products, scan barcodes, or import your existing catalogue via CSV. Categorize once, sell forever.",
    icon: PackagePlus,
    accent: "from-blue-500 to-cyan-500",
  },
  {
    n: "02",
    title: "Sell with confidence",
    description:
      "Open the POS, search, scan, and check out. Inventory updates itself, taxes are calculated, and the receipt is ready to share.",
    icon: ShoppingCart,
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    n: "03",
    title: "Watch your business grow",
    description:
      "See real-time revenue, top sellers, and profit margins. Reorder low stock in two clicks and never run out again.",
    icon: LineChart,
    accent: "from-emerald-500 to-teal-500",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge
            variant="secondary"
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
          >
            How it works
          </Badge>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Three steps to a faster shop
          </h2>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            No spreadsheets, no paper ledgers, no compromises. Just clean software that
            does exactly what you need it to.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {STEPS.map((s) => (
            <StepCard key={s.n} step={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
}: {
  step: (typeof STEPS)[number];
}) {
  const Icon = step.icon;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:shadow-xl hover:shadow-black/5">
      <div className="absolute right-5 top-5 text-5xl font-semibold tabular-nums text-muted-foreground/15 select-none">
        {step.n}
      </div>
      <div
        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.accent} text-white shadow-lg`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {step.description}
      </p>
    </div>
  );
}
