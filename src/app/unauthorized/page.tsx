import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";

export const metadata: Metadata = { title: "Unauthorized" };

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to access this page. Please contact your administrator
            if you think this is a mistake.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Sign in again</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
