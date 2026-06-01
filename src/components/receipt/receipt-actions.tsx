"use client";

import * as React from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ReceiptActions({ publicId }: { publicId: string }) {
  const [downloading, setDownloading] = React.useState(false);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/receipts/${publicId}/pdf`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${publicId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-3 w-3" /> Print
      </Button>
      <Button size="sm" onClick={handleDownload} loading={downloading}>
        <Download className="h-3 w-3" /> PDF
      </Button>
    </div>
  );
}
