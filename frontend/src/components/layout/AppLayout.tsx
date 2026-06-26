'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  StickyNote,
  LogOut,
  Moon,
  Sun,
  Settings as SettingsIcon,
  UserCog,
  CalendarDays,
  Bell,
  Loader2,
  User as UserIcon,
  Shield,
  Search,
  MessageSquare,
} from 'lucide-react';
import { AnvilIcon } from '@/components/ui/anvil-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Notification } from '@/types';
import { useAuth, User } from '@/hooks/use-auth';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { CommandPalette } from '@/components/command-palette';
import { QuickCapture } from '@/components/quick-capture';

// ─── Theme helpers ────────────────────────────────────────────────────────────
export const THEME_CLASSES = [
  'theme-indigo',
  'theme-charcoal-yellow',
  'theme-lavendar',
  'theme-lemonade',
  'theme-sunset',
  'theme-dreamy',
  'theme-crimson',
  'theme-forest',
  'theme-midnight',
  'theme-aurora',
  'theme-rose',
] as const;

export type ThemeName = 'default' | (typeof THEME_CLASSES)[number];

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
  if (theme !== 'default') root.classList.add(theme);
  localStorage.setItem('lifeos-theme', theme);
}

/*
 * ─── REDESIGNED NAVIGATION ARCHITECTURE ──────────────────────────────────────
 *
 * Mental model: 5 primary items + settings at bottom
 *
 *   Today       → /dashboard     (daily hub — "what should I do today?")
 *   Productivity → /planner, /habits, /goals, /notes   (grouped: plan, build, capture)
 *   Health      → /gym           (workout, protein, supplements)
 *   Finance     → /expenses      (transactions, budget)
 *   More        → /ai-chat, /reminders, /notifications, /password-manager
 *   ──
 *   Settings    → /settings
 *
 * Why this grouping:
 *  - "Today" is the single entry point — reduces decision fatigue
 *  - "Productivity" clusters action-oriented tools (plan → track → capture)
 *  - "Health" and "Finance" are distinct life domains users check separately
 *  - "More" prevents nav bloat; houses less-frequent features
 *  - Settings/profile are utility, pinned to bottom
 */

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  matchPaths?: string[]; // additional paths that highlight this nav item
};

const primaryNav: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Today' },
  { href: '/habits', icon: AnvilIcon, label: 'Habits', matchPaths: ['/planner', '/notes'] },
  { href: '/ai-chat', icon: MessageSquare, label: 'AI', matchPaths: ['/notifications'] },
];

// Bottom-of-sidebar mobile nav items (5 max for comfortable thumb reach)
const mobileNav: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Today' },
  { href: '/habits', icon: AnvilIcon, label: 'Habits' },
  { href: '/ai-chat', icon: MessageSquare, label: 'Chat' },
  { href: '/notes', icon: StickyNote, label: 'Notes' },
  { href: '/planner', icon: CalendarDays, label: 'Planner' },
];

function DesktopSidebar() {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    pathname === item.href || item.matchPaths?.some((p) => pathname.startsWith(p));

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[60px] flex-col items-center py-4 bg-background border-r z-50">
        {/* Logo — clean, minimal */}
        <Link href="/dashboard" className="mb-5 group">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
            <span className="text-primary font-bold text-base font-headline">L</span>
          </div>
        </Link>

        {/* Primary nav */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {primaryNav.map((item) => {
            const active = isActive(item);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom: Settings */}
        <div className="flex flex-col items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150',
                  pathname === '/settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <SettingsIcon className="h-[18px] w-[18px]" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="text-xs">
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-stretch">
        {mobileNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className={cn('text-[10px] leading-tight', active && 'font-medium')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {isDark ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
          <span>Dark Mode</span>
        </div>
        <Switch checked={isDark} onCheckedChange={toggle} aria-label="Toggle dark mode" />
      </div>
    </DropdownMenuItem>
  );
}

function UserNav({ user, onLogout }: { user: User; onLogout: () => void }) {
  const router = useRouter();
  const { isAdmin } = useAdminCheck();
  
  if (!user) return <Skeleton className="h-8 w-8 rounded-full" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* User info — compact */}
        <DropdownMenuLabel className="font-normal py-2">
          <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Quick access to nested pages */}
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/profile')}>
            <UserCog className="mr-2 h-4 w-4" />Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/planner')}>
            <CalendarDays className="mr-2 h-4 w-4" />Planner
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/notes')}>
            <StickyNote className="mr-2 h-4 w-4" />Notes
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/settings')}>
            <SettingsIcon className="mr-2 h-4 w-4" />Settings
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onSelect={() => router.push('/admin')}>
              <Shield className="mr-2 h-4 w-4" />Admin
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <ThemeToggle />
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">Notifications</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-center text-muted-foreground py-4">No new notifications</p>
        </div>
        <div className="p-1 border-t">
          <Button variant="ghost" className="w-full h-8 text-xs" onClick={() => {
            setIsOpen(false);
            router.push('/notifications');
          }}>
            View all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SearchTrigger() {
  return (
    <button
      onClick={() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }));
      }}
      className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg border bg-muted/50 text-muted-foreground text-xs hover:bg-accent transition-colors"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search</span>
      <kbd className="ml-2 inline-flex h-4 items-center gap-0.5 rounded border bg-background px-1 text-[10px] font-medium">
        Ctrl K
      </kbd>
    </button>
  );
}

function ThemeController() {
  useEffect(() => {
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'dark') document.documentElement.classList.add('dark');
    else if (savedMode === 'light') document.documentElement.classList.remove('dark');

    const savedTheme = (localStorage.getItem('lifeos-theme') as ThemeName) ?? 'default';
    THEME_CLASSES.forEach((cls) => document.documentElement.classList.remove(cls));
    if (savedTheme !== 'default') document.documentElement.classList.add(savedTheme);
  }, []);

  return null;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isSigningIn, signOut } = useAuth();
  
  useEffect(() => {
    if (!loading && !isSigningIn && !user) {
      router.replace('/login');
    }
  }, [loading, isSigningIn, user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };
  
  if (loading || isSigningIn) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ThemeController />
      <CommandPalette />
      <QuickCapture />
      <DesktopSidebar />
      
      <div className="md:ml-[60px] flex flex-col min-h-screen">
        {/* Minimal header — no redundant branding, just utility actions */}
        <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
          {/* Mobile: show logo; Desktop: search trigger */}
          <h1 className="md:hidden font-headline text-sm font-bold tracking-tight">
            <span className="text-primary">Life</span>
            <span className="text-foreground">OS</span>
          </h1>
          <SearchTrigger />
          <div className="flex-1" />
          <NotificationBell />
          <UserNav user={user} onLogout={handleLogout} />
        </header>

        {/* Main content with calm spacing */}
        <main className="flex-1 px-4 py-5 md:px-8 md:py-6 pb-20 md:pb-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
      
      <BottomNav />
    </div>
  );
}
