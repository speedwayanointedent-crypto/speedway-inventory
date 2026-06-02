import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserCog, Mail, Phone, Shield, Clock, CheckCircle2, ShieldAlert, Users } from "lucide-react";
import { getUsers } from "@/actions/admin";
import { requireRole } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { formatDate, getInitials } from "@/lib/utils";
import { UserActions } from "@/components/admin/user-actions";
import { ROLES } from "@/lib/constants";

export const metadata: Metadata = { title: "User Management" };
export const dynamic = "force-dynamic";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const STATUS_META: Record<UserRow["status"], { label: string; variant: "default" | "success" | "destructive" | "warning" | "secondary"; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  PENDING: { label: "Pending", variant: "warning", icon: Clock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  ACTIVE: { label: "Active", variant: "success", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  SUSPENDED: { label: "Suspended", variant: "destructive", icon: ShieldAlert, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const me = await requireRole(ROLES.ADMIN);
  const users = (await getUsers()) as UserRow[];

  const counts = {
    total: users.length,
    pending: users.filter((u) => u.status === "PENDING").length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    suspended: users.filter((u) => u.status === "SUSPENDED").length,
  };

  const filtered = users.filter((u) => {
    if (sp.status && sp.status !== "all" && u.status !== sp.status) return false;
    if (sp.search) {
      const s = sp.search.toLowerCase();
      return (
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.phone || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Users" description={`${users.length} users · manage access and roles`}>
        <Button asChild className="shadow-lg shadow-primary/20">
          <Link href="/admin/users/new">
            <Plus className="h-4 w-4" /> Invite User
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard label="Total" value={counts.total} icon={Users} accent="from-blue-500 to-cyan-500" />
        <SummaryCard
          label="Pending"
          value={counts.pending}
          icon={Clock}
          accent="from-amber-500 to-orange-500"
          highlight={counts.pending > 0}
        />
        <SummaryCard label="Active" value={counts.active} icon={CheckCircle2} accent="from-emerald-500 to-teal-500" />
        <SummaryCard label="Suspended" value={counts.suspended} icon={ShieldAlert} accent="from-rose-500 to-red-500" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Search by name, email, phone..." />
        <div className="flex gap-1 flex-wrap">
          {([
            { key: "all", label: "All" },
            { key: "PENDING", label: "Pending" },
            { key: "ACTIVE", label: "Active" },
            { key: "SUSPENDED", label: "Suspended" },
          ] as const).map((t) => {
            const isActive = (sp.status ?? "all") === t.key;
            return (
              <Button
                key={t.key}
                asChild
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="h-9"
              >
                <Link href={t.key === "all" ? "/admin/users" : `/admin/users?status=${t.key}`}>
                  {t.label}
                  {t.key === "PENDING" && counts.pending > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-[10px]">
                      {counts.pending}
                    </Badge>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={UserCog}
            title="No users"
            description="Add admins and staff to operate your store."
            action={
              <Button asChild>
                <Link href="/admin/users/new">
                  <Plus className="h-4 w-4" /> Invite User
                </Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => {
            const meta = STATUS_META[u.status];
            const StatusIcon = meta.icon;
            const isPending = u.status === "PENDING";
            return (
              <Card
                key={u._id}
                className={`relative overflow-hidden p-4 sm:p-5 transition-all hover:shadow-lg ${
                  isPending ? "ring-1 ring-amber-500/30 bg-gradient-to-br from-amber-500/[0.03] to-transparent" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-background shadow-md shrink-0">
                    <AvatarFallback
                      className={`text-sm font-semibold ${
                        u.role === "ADMIN"
                          ? "bg-gradient-to-br from-primary to-blue-600 text-primary-foreground"
                          : "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white"
                      }`}
                    >
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{u.name}</p>
                      {me.id === u._id && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="h-3 w-3 shrink-0" /> {u.email}
                    </p>
                  </div>
                  <UserActions
                    id={u._id}
                    name={u.name}
                    email={u.email}
                    isSelf={me.id === u._id}
                    isActive={u.isActive}
                    role={u.role}
                    status={u.status}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={u.role === "ADMIN" ? "default" : "outline"}
                    className="text-[10px] h-5"
                  >
                    <Shield className="h-3 w-3 mr-1" /> {u.role}
                  </Badge>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${meta.className}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {meta.label}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium mt-0.5 truncate">
                      {u.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {u.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last login</p>
                    <p className="font-medium mt-0.5">
                      {u.lastLogin ? formatDate(u.lastLogin, true) : "Never"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Joined {formatDate(u.createdAt)}</span>
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                      <Clock className="h-3 w-3" /> Awaiting review
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`relative overflow-hidden p-4 sm:p-5 transition-all ${
        highlight ? "ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl`}
      />
      <div className="flex items-center justify-between relative">
        <div>
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1 sm:mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-md`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </Card>
  );
}
