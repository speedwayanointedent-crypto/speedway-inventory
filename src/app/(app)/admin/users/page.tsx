import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserCog, Mail, Phone, Shield } from "lucide-react";
import { getUsers } from "@/actions/admin";
import { requireAuth } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { formatDate, getInitials } from "@/lib/utils";
import { UserActions } from "@/components/admin/user-actions";

export const metadata: Metadata = { title: "User Management" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const sp = await searchParams;
  const me = await requireAuth();
  const users = (await getUsers()) as Array<{
    _id: string;
    name: string;
    email: string;
    role: "ADMIN" | "STAFF";
    phone?: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
  }>;
  const filtered = users.filter((u) => {
    if (sp.role && sp.role !== "all" && u.role !== sp.role) return false;
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
    <div>
      <PageHeader title="Users" description={`${users.length} users`}>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="h-4 w-4" /> Invite User
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchInput placeholder="Search users..." />
        <div className="flex gap-1">
          {(["all", "ADMIN", "STAFF"] as const).map((r) => (
            <Button
              key={r}
              asChild
              size="sm"
              variant={sp.role === r || (!sp.role && r === "all") ? "default" : "outline"}
            >
              <Link href={r === "all" ? "/admin/users" : `/admin/users?role=${r}`}>
                {r === "all" ? "All" : r}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "default" : "outline"}>
                      <Shield className="h-3 w-3 mr-1" /> {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.phone ? (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {u.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.lastLogin ? formatDate(u.lastLogin, true) : "Never"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    <UserActions
                      id={u._id}
                      name={u.name}
                      isSelf={me.id === u._id}
                      isActive={u.isActive}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
