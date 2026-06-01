import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: APP_CONFIG.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_CONFIG.url}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_CONFIG.url}/forgot-password`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
