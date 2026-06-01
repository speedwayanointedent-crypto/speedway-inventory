"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/constants";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-14 w-14 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        We hit a snag loading this page. Please try again.
      </p>
      {error.digest && (
        <code className="text-xs bg-muted px-2 py-1 rounded mt-3">Error ID: {error.digest}</code>
      )}
      <div className="flex gap-2 mt-6">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4" /> Home
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-8">{APP_CONFIG.name}</p>
    </div>
  );
}
