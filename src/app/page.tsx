import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Stats } from "@/components/landing/stats";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Capabilities } from "@/components/landing/capabilities";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { APP_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — Inventory & POS for spare-parts dealers`,
  description: APP_CONFIG.description,
  alternates: { canonical: APP_CONFIG.url },
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingNav />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Capabilities />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
