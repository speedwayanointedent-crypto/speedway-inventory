"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  user: { name: string; email: string; role: string; avatar?: string };
  unreadCount?: number;
  onMenuClick: () => void;
}

export function Header({ user, unreadCount = 0, onMenuClick }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 border-b border-border/60 bg-background/80 px-3 sm:px-4 lg:px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden -ml-1 h-10 w-10"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Link href="/dashboard" className="lg:hidden flex items-center gap-2 mr-1">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20">
          <span className="text-xs font-bold">SW</span>
        </div>
      </Link>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
        className="h-10 w-10"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      <Link href="/notifications" aria-label="Notifications">
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center px-1 ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1.5 sm:gap-2 rounded-full hover:bg-accent/60 active:bg-accent p-1 transition"
            aria-label="Account menu"
          >
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-background">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
              <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground text-xs font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-none">{user.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{user.email}</p>
            </div>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 mt-1">
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-primary/10 to-blue-500/5">
              <Avatar className="h-10 w-10">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground text-xs font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{user.name}</span>
                <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                <Badge variant="outline" className="mt-1 w-fit text-[9px] h-4 px-1.5">
                  {user.role}
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="py-2.5">
            <Link href="/profile">
              <User className="h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
          {user.role === "ADMIN" && (
            <DropdownMenuItem asChild className="py-2.5">
              <Link href="/admin/settings">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-destructive focus:text-destructive py-2.5"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
