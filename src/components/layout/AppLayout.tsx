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
  Bot,
  User as UserIcon,
  Shield,
  CheckCircle2,
  Sunrise,
  Sunset,
  Clock,
  Dumbbell,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isSameDay, isFuture } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Notification, Habit } from '@/types';
import { useAuth, User } from '@/hooks/use-auth';
// Removed: useAdminCheck, useOfflineQueue, useSafeFirestore, QueueSyncIndicator

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/habits', icon: AnvilIcon, label: 'Forge' },
  { href: '/notes', icon: StickyNote, label: 'Notes' },
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
      <nav className="flex-1 flex flex-col gap-1">
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
              <item.icon className={cn("transition-all duration-200", isActive ? "h-6 w-6" : "h-5 w-5")} />
              
              <div className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border shadow-lg z-50">
                {item.label}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover border-l border-t rotate-45"></div>
              </div>
            </Link>
          );
        })}
        
        {/* AI Chat Link */}
        <Link
          href="/ai-chat"
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group relative',
            pathname === '/ai-chat'
              ? 'bg-primary text-primary-foreground shadow-lg scale-105'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-105'
          )}
        >
          <Bot className={cn("transition-all duration-200", pathname === '/ai-chat' ? "h-6 w-6" : "h-5 w-5")} />
          
          <div className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap border shadow-lg z-50">
            AI Chat
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
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-sm transition-colors',
              pathname === item.href
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                  {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>Dark Mode</span>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} aria-label="Toggle dark mode" />
          </div>
      </DropdownMenuItem>
  );
}

function UserNav({ user, onLogout }: { user: User, onLogout: () => void }) {
  const router = useRouter();
  // Mock admin check
  const isAdmin = user.email ? user.email.includes('admin') : false;
  
  if (!user) return <Skeleton className="h-8 w-8 rounded-full" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
            <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">
              Welcome back!
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuItem onSelect={() => router.push('/profile')}>
              <UserCog className="mr-2 h-4 w-4" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
           <DropdownMenuItem onSelect={() => router.push('/planner')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Daily Planner</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/gym')}>
            <Dumbbell className="mr-2 h-4 w-4" />
            <span>Gym Tracker</span>
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
          <span>About Me</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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

function HeaderCalendar() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentMonth(prev => {
        const next = new Date(prev);
        next.setMonth(next.getMonth() + 1);
        return next;
      });
    }
    
    if (isRightSwipe) {
      setCurrentMonth(prev => {
        const next = new Date(prev);
        next.setMonth(next.getMonth() - 1);
        return next;
      });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const handleAddReminder = async () => {
    // Placeholder: Connect to backend
    console.log('Replacing Firebase: Add reminder', { title, message, date });
    setDate(undefined);
    setTitle('');
    setMessage('');
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isSameDate = (d1: Date, d2: Date | undefined) => {
    if (!d2) return false;
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };
  
  const isToday = (d: Date) => {
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };
  
  const isPast = (d: Date) => d < today;
  
  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <CalendarDays className="h-5 w-5" />
          <span className="sr-only">Open calendar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-3 sm:px-4 pt-3 pb-2 border-b">
          <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Calendar & Reminders
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 sm:p-4 space-y-3 overflow-y-auto">
          {date && (isFuture(date) || isSameDay(date, today)) && (
            <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-lg p-2.5 sm:p-4 space-y-2 sm:space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="line-clamp-1">
                    Add Reminder for {format(date, 'MMM d, yyyy')}
                  </span>
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDate(undefined)}
                  className="h-5 w-5 sm:h-6 sm:w-6 p-0 shrink-0 text-xs"
                >
                  
                </Button>
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="reminder-title" className="text-xs font-medium">
                    Title
                  </Label>
                  <Input 
                    id="reminder-title" 
                    placeholder="e.g., Mom's Birthday" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="reminder-message" className="text-xs font-medium">
                    Message
                  </Label>
                  <Textarea 
                    id="reminder-message" 
                    placeholder="e.g., Call her in the morning" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    className="min-h-[50px] sm:min-h-[60px] resize-none text-xs sm:text-sm"
                  />
                </div>
                
                <Button 
                  size="sm"
                  className="w-full h-8 sm:h-9 text-xs sm:text-sm font-semibold" 
                  onClick={handleAddReminder} 
                  disabled={!user || !title.trim() || !message.trim()}
                >
                  <Bell className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Set Reminder
                </Button>
              </div>
            </div>
          )}

          <div className="w-full">
            <div className="bg-card border rounded-lg shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(prev => {
                    const next = new Date(prev);
                    next.setMonth(next.getMonth() - 1);
                    return next;
                  })}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  
                </Button>
                
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                    className="h-6 text-xs px-2 hidden sm:flex"
                  >
                    Today
                  </Button>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(prev => {
                    const next = new Date(prev);
                    next.setMonth(next.getMonth() + 1);
                    return next;
                  })}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  
                </Button>
              </div>
              
              <div 
                className="p-2 sm:p-4 select-none touch-pan-y"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    const isSelected = isSameDate(day.date, date);
                    const isTodayDate = isToday(day.date);
                    const isPastDate = isPast(day.date);
                    const isDisabled = isPastDate && !isTodayDate;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (!isDisabled && day.isCurrentMonth) {
                            setDate(day.date);
                          }
                        }}
                        disabled={isDisabled}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-lg text-sm sm:text-base font-medium transition-all",
                          "hover:bg-accent active:scale-95",
                          !day.isCurrentMonth && "text-muted-foreground/40",
                          day.isCurrentMonth && !isDisabled && "text-foreground",
                          isDisabled && "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent",
                          isTodayDate && !isSelected && "bg-accent font-bold ring-2 ring-primary",
                          isSelected && "bg-primary text-primary-foreground font-bold shadow-lg scale-105",
                          !isSelected && !isTodayDate && !isDisabled && "hover:scale-105"
                        )}
                      >
                        {day.date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThemeController() {
  // Placeholder for real theme fetching
  return null;
}

function AIAssistanceButton() {
  const router = useRouter();

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 relative"
      onClick={() => router.push('/ai-chat')}
    >
      <Bot className="h-4 w-4" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
      <span className="sr-only">AI Assistant</span>
    </Button>
  );
}

function QuickCheckInModal() {
  // Mock Implementation
  const [isOpen, setIsOpen] = useState(false);
  const habits: Habit[] = []; // Empty for now

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="hover:bg-primary/10 hover:text-primary hover:border-primary"
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
            <DialogTitle>Quick Check-In</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center">
            <p>Habits tracking coming soon with backend integration.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };
  
  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ThemeController />
      <DesktopSidebar />
      
      <div className="md:ml-16 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 sm:px-6 backdrop-blur-sm">
          <h1 className="font-headline text-lg font-bold text-primary">LifeOS</h1>
          <div className="flex-1" />
          
          <QuickCheckInModal />
          <AIAssistanceButton />
          <NotificationBell />
          <HeaderCalendar />
          <UserNav user={user} onLogout={handleLogout} />
        </header>
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-4">
          {children}
        </main>
      </div>
      
      <BottomNav />
    </div>
  );
}
