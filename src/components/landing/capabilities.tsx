"use client";

import {
  QrCode,
  Boxes,
  BadgePercent,
  Lock,
  FileSpreadsheet,
  FileText,
  Globe2,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CAPABILITIES = [
  { icon: QrCode, label: "QR receipts" },
  { icon: Boxes, label: "Stock-takes" },
  { icon: BadgePercent, label: "Wholesale tiers" },
  { icon: FileText, label: "PDF reports" },
  { icon: FileSpreadsheet, label: "Excel exports" },
  { icon: Receipt, label: "Returns & refunds" },
  { icon: Lock, label: "Audit trail" },
  { icon: Globe2, label: "Bilingual ready" },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="relative border-y border-border/60 bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Badge
              variant="secondary"
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur"
            >
              Capabilities
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              All the small things, handled.
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Every feature a spare-parts shop actually needs is in the box. Nothing
              extra to learn, nothing extra to pay for.
            </p>
          </div>
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CAPABILITIES.map((c) => (
                <div
                  key={c.label}
                  className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3 transition-all hover:border-border hover:shadow-md"
                >
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
