"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Stat {
  value: number;
  suffix?: string;
  label: string;
  description: string;
}

const STATS: Stat[] = [
  { value: 99.9, suffix: "%", label: "Uptime", description: "Always-on cloud infrastructure" },
  { value: 1200, suffix: "+", label: "SKUs handled daily", description: "Built for high-volume stockrooms" },
  { value: 3, suffix: "s", label: "Avg. checkout time", description: "Fastest POS in the industry" },
  { value: 24, suffix: "/7", label: "Support", description: "Real humans, real help" },
];

export function Stats() {
  return (
    <section className="relative border-y border-border/60 bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <StatItem key={s.label} stat={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            setStarted(true);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(stat.value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, stat.value]);

  const display =
    stat.value % 1 === 0
      ? Math.round(value).toLocaleString()
      : value.toFixed(1);

  return (
    <div ref={ref} className="text-center sm:text-left">
      <div className="flex items-baseline justify-center gap-0.5 sm:justify-start">
        <span
          className={cn(
            "text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl",
            "bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent",
          )}
        >
          {display}
        </span>
        {stat.suffix && (
          <span className="text-2xl font-semibold text-foreground/70 sm:text-3xl">
            {stat.suffix}
          </span>
        )}
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{stat.label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{stat.description}</div>
    </div>
  );
}
