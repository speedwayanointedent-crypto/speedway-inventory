"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="hidden lg:flex fixed inset-y-0 left-0 w-64 z-40">
        <Sidebar user={user} />
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:hidden shadow-2xl animate-in slide-in-from-left">
            <Sidebar user={user} onClose={() => setOpen(false)} />
          </div>
        </>
      )}

      <div className="lg:pl-64">
        <Header user={user} unreadCount={unreadCount} onMenuClick={() => setOpen(true)} />
        <main className="px-4 sm:px-5 lg:px-8 py-5 sm:py-6 pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-8 max-w-[1600px] mx-auto">
          {children}
        </main>
        <BottomNav user={user} onMoreClick={() => setOpen(true)} />
      </div>
    </div>
  );
}
