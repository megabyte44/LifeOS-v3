'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Wallet,
  StickyNote,
  LogOut,
  Moon,
  Sun,
  KeyRound,
  Settings as SettingsIcon,
  UserCog,
  CalendarDays,
  Bell,
  Loader2,
  User as UserIcon,
  Shield,
  Dumbbell,
  Target,
  CalendarCheck,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Notification } from '@/types';
import { useAuth, User } from '@/hooks/use-auth';
import { useAdminCheck } from '@/hooks/use-admin-check';

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

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/habits', icon: AnvilIcon, label: 'Forge' },
  { href: '/notes', icon: StickyNote, label: 'Notes' },
  { href: '/gym', icon: Dumbbell, label: 'Gym' },
];

function DesktopSidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-16 flex-col items-center py-4 bg-background/95 backdrop-blur-sm border-r z-50">
      {/* Logo */}
      <div className="mb-6">
        <Link href="/dashboard" className="group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
            <span className="text-primary-foreground font-bold text-lg">L</span>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105'
              )}
            >
              <item.icon className={cn('transition-all duration-200', isActive ? 'h-6 w-6' : 'h-5 w-5')} />
              <div className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border shadow-lg z-50">
                {item.label}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover border-l border-t rotate-45"></div>
              </div>
            </Link>
          );
        })}

        {/* Goals */}
        <Link
          href="/goals"
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group relative',
            pathname === '/goals'
              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105'
          )}
        >
          <Target className={cn('transition-all duration-200', pathname === '/goals' ? 'h-6 w-6' : 'h-5 w-5')} />
          <div className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border shadow-lg z-50">
            Goals
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover border-l border-t rotate-45"></div>
          </div>
        </Link>
      </nav>
      
      {/* Bottom Actions */}
      <div className="flex flex-col gap-1">
        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group relative',
            pathname === '/settings'
              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105'
          )}
        >
          <SettingsIcon className={cn("transition-all duration-200", pathname === '/settings' ? "h-6 w-6" : "h-5 w-5")} />
          
          <div className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border shadow-lg z-50">
            Settings
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover border-l border-t rotate-45"></div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm">
      <div className="flex h-16 items-stretch overflow-x-auto scrollbar-hide snap-x">
        {navItems.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[4.2rem] flex-1 snap-start transition-colors px-1',
              pathname === item.href
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span className="text-[10px] leading-tight">{item.label}</span>
          </Link>
        ))}
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
  
  if (!user) return <Skeleton className="h-9 w-9 rounded-full" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        {/* User info */}
        <DropdownMenuLabel className="font-normal py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-semibold leading-none">{user.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1 truncate max-w-[140px]">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/profile')}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/planner')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Daily Planner</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/habits')}>
            <AnvilIcon className="mr-2 h-4 w-4" />
            <span>Habits &amp; Forge</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/goals')}>
            <Target className="mr-2 h-4 w-4" />
            <span>Goals</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/gym')}>
            <Dumbbell className="mr-2 h-4 w-4" />
            <span>Gym Tracker</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/reminders')}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            <span>Reminders</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/password-manager')}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>Password Manager</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/settings')}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onSelect={() => router.push('/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <ThemeToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/about')}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>About</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBell() {
  const router = useRouter();
  const [notifications] = useState<Notification[]>([]); // Empty state for now
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <ScrollArea className="max-h-80">
            <div className="p-2 space-y-2">
               <p className="text-sm text-center text-muted-foreground py-8">No new reminders today.</p>
            </div>
        </ScrollArea>
        <div className="p-1 border-t bg-muted/50">
            <Button variant="link" className="w-full h-8 text-xs" onClick={() => {
                setIsOpen(false);
                router.push('/notifications');
            }}>
                View all notifications
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// HeaderCalendar is now a simple icon button navigating to /reminders

function ThemeController() {
  useEffect(() => {
    // Apply dark/light mode
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'dark') document.documentElement.classList.add('dark');
    else if (savedMode === 'light') document.documentElement.classList.remove('dark');

    // Apply colour theme
    const savedTheme = (localStorage.getItem('lifeos-theme') as ThemeName) ?? 'default';
    THEME_CLASSES.forEach((cls) => document.documentElement.classList.remove(cls));
    if (savedTheme !== 'default') document.documentElement.classList.add(savedTheme);
  }, []);

  return null;
}

function HeaderCalendar() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => router.push('/reminders')}
      title="Reminders & Calendar"
    >
      <CalendarDays className="h-4 w-4" />
      <span className="sr-only">Open reminders</span>
    </Button>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isSigningIn, signOut } = useAuth();
  
  useEffect(() => {
    // Only redirect when auth is fully settled AND not in the middle of signing in
    if (!loading && !isSigningIn && !user) {
      router.replace('/login');
    }
  }, [loading, isSigningIn, user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };
  
  // Show spinner while Firebase is resolving auth state OR while sign-in popup is in-flight.
  // Once loading/isSigningIn is false and user is null, the useEffect above redirects;
  // return null here to avoid showing the spinner during that brief navigation.
  if (loading || isSigningIn) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ThemeController />
      <DesktopSidebar />
      
      <div className="md:ml-16 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 sm:px-6 backdrop-blur-sm">
          <h1 className="font-headline text-lg font-bold tracking-tight">
            <span className="text-primary">Life</span>
            <span className="text-foreground">OS</span>
          </h1>
          <div className="flex-1" />
          <NotificationBell />
          <HeaderCalendar />
          <UserNav user={user} onLogout={handleLogout} />
        </header>
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      
      <BottomNav />
    </div>
  );
}
