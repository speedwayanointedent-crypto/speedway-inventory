import type { Metadata } from "next";
import { Activity, Filter } from "lucide-react";
import { getActivityLogs } from "@/lib/activity";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { Pagination } from "@/components/layout/pagination";
import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = { title: "Activity Log" };

const MODULES = ["all", "AUTH", "INVENTORY", "SALES", "USERS", "SETTINGS", "RETURNS"];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; module?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const { items, total, totalPages } = await getActivityLogs({
    search: sp.search,
    module: sp.module,
    page,
    limit: 25,
  });

  return (
    <div>
      <PageHeader title="Activity Log" description={`${total} events`} icon={Activity} />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchInput placeholder="Search events..." />
        <div className="flex gap-1 overflow-x-auto">
          {MODULES.map((m) => (
            <Button
              key={m}
              asChild
              size="sm"
              variant={sp.module === m || (!sp.module && m === "all") ? "default" : "outline"}
            >
              <Link href={m === "all" ? "/admin/activity" : `/admin/activity?module=${m}`}>
                <Filter className="h-3 w-3" /> {m}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {(items as unknown[]).length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet" description="User actions will appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(items as Array<{
                _id: string;
                userName: string;
                userEmail: string;
                action: string;
                module: string;
                description: string;
                createdAt: string;
              }>).map((a) => (
                <TableRow key={a._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">{getInitials(a.userName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{a.userName}</p>
                        <p className="text-xs text-muted-foreground">{a.userEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.action}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.module}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{a.description}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(a.createdAt, true)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
