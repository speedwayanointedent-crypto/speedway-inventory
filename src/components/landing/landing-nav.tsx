"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, X, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#contact", label: "Contact" },
];

export function LandingNav() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Wrench className="h-4.5 w-4.5" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">{APP_CONFIG.shortName}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Anointed Enterprise</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/60 text-foreground/80 backdrop-blur transition-colors hover:bg-muted"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex shadow-lg shadow-primary/20">
            <Link href="/login">Open app</Link>
          </Button>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((s) => !s)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/60 text-foreground/80 backdrop-blur md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              <Button asChild variant="outline" className="flex-1" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="flex-1" size="sm">
                <Link href="/login">Open app</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
