import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/pos", "/dashboard", "/inventory", "/sales", "/customers", "/suppliers", "/reports", "/categories", "/stock-entries", "/returns", "/notifications", "/profile"] },
      { userAgent: "*", allow: "/receipt/" },
    ],
    sitemap: `${APP_CONFIG.url}/sitemap.xml`,
  };
}
