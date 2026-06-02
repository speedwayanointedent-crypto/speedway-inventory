import { redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Mail, ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { APP_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PendingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "ACTIVE") redirect("/dashboard");

  const suspended = user.status === "SUSPENDED" || sp.reason === "suspended";

  return (
    <div className="min-h-screen flex items-center justify-center px-5 sm:px-6 py-8 bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div
            className={`mx-auto h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg ring-4 ${
              suspended
                ? "bg-destructive/10 text-destructive ring-destructive/10"
                : "bg-amber-500/10 text-amber-500 ring-amber-500/10"
            }`}
          >
            {suspended ? <ShieldAlert className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xl shadow-black/5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
            {suspended ? "Account suspended" : "Awaiting approval"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2 leading-relaxed">
            {suspended
              ? "Your account has been suspended. Reach out to an administrator to restore access."
              : "Your account has been created. An administrator needs to review and approve it before you can sign in."}
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium truncate ml-3">{user.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate ml-3">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`font-semibold ${
                  suspended ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {suspended ? "Suspended" : "Pending review"}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <a
              href={`mailto:${APP_CONFIG.email}?subject=${encodeURIComponent(
                "Account activation request",
              )}&body=${encodeURIComponent(
                `Hello Admin,\n\nMy account (${user.email}) is awaiting approval. Please activate it and assign a role.\n\nThank you.`,
              )}`}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-105 transition"
            >
              <Mail className="h-4 w-4" /> Contact admin to activate
            </a>
            <SignOutButton />
          </div>

          <p className="text-[11px] text-center text-muted-foreground mt-6">
            Need help? Reach the team at{" "}
            <a
              href={`mailto:${APP_CONFIG.email}`}
              className="text-primary hover:underline font-medium"
            >
              {APP_CONFIG.email}
            </a>
          </p>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-4">
          {APP_CONFIG.name}
        </p>
      </div>
    </div>
  );
}
