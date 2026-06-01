import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/lib/constants";

const PILL_FEATURES = [
  "Real-time stock tracking",
  "WhatsApp-ready receipts",
  "Multi-user roles",
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <Badge
          variant="secondary"
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Built for wholesale spare-parts dealers in Ghana</span>
        </Badge>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Run your spare-parts shop{" "}
          <span className="bg-gradient-to-br from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
            at full throttle
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          The all-in-one inventory and point-of-sale platform built for{" "}
          {APP_CONFIG.shortName}. Track every part, ring up sales in seconds, and keep
          customers coming back with QR-coded digital receipts.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {PILL_FEATURES.map((f) => (
            <li key={f} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
