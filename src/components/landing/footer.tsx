import Link from "next/link";
import { Wrench, Mail, Phone, MapPin } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Capabilities", href: "#capabilities" },
      { label: "Open app", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Contact", href: "#contact" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-lg shadow-primary/20">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight">
                  {APP_CONFIG.shortName}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Anointed Enterprise
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {APP_CONFIG.description}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${APP_CONFIG.email}`} className="hover:text-foreground">
                  {APP_CONFIG.email}
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{APP_CONFIG.phone}</span>
              </li>
              <li className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Accra, Ghana</span>
              </li>
            </ul>
          </div>

          {COLUMNS.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                {c.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Crafted with care in Ghana.
          </p>
        </div>
      </div>
    </footer>
  );
}
