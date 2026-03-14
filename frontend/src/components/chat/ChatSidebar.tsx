'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Sparkles,
  Search,
  Clock,
  MessageCircle,
  Trash2,
  Edit2,
  Check,
  X,
  Brain,
  PanelLeftClose,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AI_PERSONALITIES,
  type ChatSession,
  groupSessionsByDate,
} from './chat-constants';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isTemporaryChat: boolean;
  isMobileOpen: boolean;
  sidebarSearch: string;
  onSearchChange: (v: string) => void;
  onNewChat: () => void;
  onToggleTemp: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onClearAll: () => void;
  onCloseMobile: () => void;
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  isTemporaryChat,
  isMobileOpen,
  sidebarSearch,
  onSearchChange,
  onNewChat,
  onToggleTemp,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onClearAll,
  onCloseMobile,
}: ChatSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const nonTempSessions = sessions.filter((s) => s.id !== 'temp');
  const filteredSessions = sidebarSearch.trim()
    ? nonTempSessions.filter((s) =>
        s.title.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : nonTempSessions;
  const groupedSessions = groupSessionsByDate(filteredSessions);

  const startRename = (id: string, title: string) => {
    setEditingSessionId(id);
    setEditingTitle(title);
  };

  const saveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const cancelRename = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'flex flex-col overflow-hidden',
          'bg-muted/50 dark:bg-[hsl(var(--background))]/80',
          'border-r border-border/40',
          // Mobile
          'fixed inset-y-0 left-0 z-50 w-[260px] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          // Desktop
          'md:relative md:inset-auto md:z-auto md:translate-x-0 md:w-[260px] md:shrink-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top: New chat + close */}
        <div className="flex items-center gap-2 p-3 shrink-0">
          <button
            onClick={onNewChat}
            className="group flex-1 flex items-center gap-2 h-10 px-3 rounded-lg border border-border/50 bg-background/60 hover:bg-background text-sm font-medium transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-muted-foreground transition-transform group-hover:rotate-90 duration-200" />
            <span>New chat</span>
          </button>
          <button
            className="md:hidden h-10 w-10 rounded-lg border border-border/50 bg-background/60 hover:bg-background flex items-center justify-center transition-colors"
            onClick={onCloseMobile}
          >
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Temp toggle */}
        <div className="px-3 pb-2 shrink-0">
          <button
            onClick={onToggleTemp}
            className={cn(
              'w-full flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium transition-all active:scale-[0.98]',
              isTemporaryChat
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground/70 hover:bg-background/60 hover:text-foreground'
            )}
          >
            <Sparkles className={cn('h-3.5 w-3.5', isTemporaryChat && 'text-amber-500')} />
            {isTemporaryChat ? 'Exit temporary' : 'Temporary chat'}
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
            <input
              value={sidebarSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-background/50 border border-border/30 rounded-lg focus:outline-none focus:border-border/60 placeholder:text-muted-foreground/35 transition-colors"
            />
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 min-h-0 chat-scrollbar">
          {nonTempSessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <MessageCircle className="h-6 w-6 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/40">No conversations yet</p>
            </div>
          ) : groupedSessions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs text-muted-foreground/40">
                No results for &ldquo;{sidebarSearch}&rdquo;
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {groupedSessions.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-1.5 px-2 mb-1">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/30" />
                    <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  <div className="space-y-px">
                    {group.items.map((session) => {
                      const p = AI_PERSONALITIES[session.personality];
                      const isActive = currentSessionId === session.id;
                      return (
                        <div
                          key={session.id}
                          className={cn(
                            'group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors duration-100',
                            isActive
                              ? 'bg-background/80 dark:bg-card/60'
                              : 'hover:bg-background/50 dark:hover:bg-card/30'
                          )}
                          onClick={() => {
                            if (editingSessionId === session.id) return;
                            onSelectSession(session.id);
                            onCloseMobile();
                          }}
                        >
                          <div
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              p.dotBg,
                              isActive ? 'opacity-100' : 'opacity-30'
                            )}
                          />

                          <div className="flex-1 min-w-0">
                            {editingSessionId === session.id ? (
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="flex-1 min-w-0 text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRename(session.id);
                                    if (e.key === 'Escape') cancelRename();
                                  }}
                                  autoFocus
                                />
                                <button onClick={() => saveRename(session.id)} className="p-0.5 text-muted-foreground hover:text-primary"><Check className="h-3 w-3" /></button>
                                <button onClick={cancelRename} className="p-0.5 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                              </div>
                            ) : (
                              <p className={cn(
                                'text-[13px] truncate leading-snug',
                                isActive ? 'text-foreground font-medium' : 'text-foreground/70'
                              )}>
                                {session.title}
                              </p>
                            )}
                          </div>

                          {editingSessionId !== session.id && (
                            <div
                              className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="p-1 rounded hover:bg-muted text-muted-foreground/40 hover:text-foreground transition-colors"
                                onClick={() => startRename(session.id, session.title)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors"
                                onClick={() => onDeleteSession(session.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-2 space-y-1 border-t border-border/20">
          {nonTempSessions.length > 0 && (
            <button
              onClick={onClearAll}
              className="w-full flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          )}
          <Link
            href="/ai-chat/memories"
            className="flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] text-muted-foreground/50 hover:text-foreground hover:bg-background/60 transition-colors"
          >
            <Brain className="h-3.5 w-3.5" />
            AI Memories
          </Link>
        </div>
      </aside>
    </>
  );
}
