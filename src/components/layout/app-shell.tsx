"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import type { Permission } from "@/lib/constants";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
    permissions: Permission[];
  };
  unreadCount?: number;
}

export function AppShell({ children, user, unreadCount }: AppShellProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-64 z-40">
        <Sidebar user={user} />
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <Sidebar user={user} onClose={() => setOpen(false)} />
          </div>
        </>
      )}

      <div className="lg:pl-64">
        <Header user={user} unreadCount={unreadCount} onMenuClick={() => setOpen(true)} />
        <main className="px-4 lg:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
