'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  StickyNote,
  CalendarDays,
  Settings,
  Bell,
  User,
  Shield,
  Search,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { AnvilIcon } from '@/components/ui/anvil-icon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type CommandItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
  keywords?: string[];
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-today', label: 'Go to Today', icon: LayoutDashboard, action: () => router.push('/dashboard'), group: 'Navigate', keywords: ['dashboard', 'home'] },
    { id: 'nav-planner', label: 'Go to Planner', icon: CalendarDays, action: () => router.push('/planner'), group: 'Navigate', keywords: ['schedule', 'calendar', 'routine'] },
    { id: 'nav-habits', label: 'Go to Habits', icon: AnvilIcon, action: () => router.push('/habits'), group: 'Navigate', keywords: ['forge', 'streaks', 'tracking'] },
    { id: 'nav-notes', label: 'Go to Notes', icon: StickyNote, action: () => router.push('/notes'), group: 'Navigate', keywords: ['markdown', 'writing'] },
    { id: 'nav-ai', label: 'Go to AI Chat', icon: MessageSquare, action: () => router.push('/ai-chat'), group: 'Navigate', keywords: ['assistant', 'chat'] },
    { id: 'nav-notifications', label: 'Go to Notifications', icon: Bell, action: () => router.push('/notifications'), group: 'Navigate' },
    { id: 'nav-profile', label: 'Go to Profile', icon: User, action: () => router.push('/profile'), group: 'Navigate' },
    { id: 'nav-settings', label: 'Go to Settings', icon: Settings, action: () => router.push('/settings'), group: 'Navigate', keywords: ['theme', 'preferences'] },
    { id: 'nav-admin', label: 'Go to Admin', icon: Shield, action: () => router.push('/admin'), group: 'Navigate' },
  ];

  const filtered = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.group.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        );
      })
    : commands;

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  const flatItems = Object.values(groups).flat();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeSelected = useCallback(() => {
    const item = flatItems[selectedIndex];
    if (item) {
      item.action();
      setOpen(false);
      setQuery('');
    }
  }, [flatItems, selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(''); }}>
      <DialogContent className="p-0 gap-0 max-w-[540px] rounded-xl overflow-hidden border shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{group}</div>
              {items.map((item) => {
                const globalIdx = flatItems.indexOf(item);
                const isSelected = globalIdx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setOpen(false);
                      setQuery('');
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={cn(
                      'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-colors',
                      isSelected ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isSelected && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          ))}
          {flatItems.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No results found.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
