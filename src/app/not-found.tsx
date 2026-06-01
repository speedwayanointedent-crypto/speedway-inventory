import Link from "next/link";
import { Wrench, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-muted/30">
      <div className="h-16 w-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4">
        <Wrench className="h-8 w-8" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-lg text-muted-foreground mt-2">Page not found</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        The page you are looking for might have been moved or doesn&apos;t exist.
      </p>
      <div className="flex gap-2 mt-6">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" /> Go home
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-8">{APP_CONFIG.name}</p>
    </div>
  );
}
