import type { Metadata } from "next";
import { POSClient } from "@/components/pos/pos-client";
import { APP_CONFIG } from "@/lib/constants";

export const metadata: Metadata = { title: "Point of Sale" };

export default function POSPage() {
  return <POSClient taxRate={APP_CONFIG.taxRate} />;
}
