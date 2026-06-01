"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-muted/30">
          <div className="h-16 w-16 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            An unexpected error occurred. Our team has been notified.
          </p>
          {error.digest && (
            <code className="text-xs bg-muted px-2 py-1 rounded mt-3">
              Error ID: {error.digest}
            </code>
          )}
          <div className="flex gap-2 mt-6">
            <Button onClick={reset} variant="outline">
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
            <Button asChild>
              <a href="/">
                <Home className="h-4 w-4" /> Home
              </a>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
