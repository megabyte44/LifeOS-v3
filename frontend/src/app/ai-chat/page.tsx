'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  User,
  MessageSquare,
  Trash2,
  Plus,
  Copy,
  Zap,
  Edit2,
  Check,
  X,
  Menu,
  Sparkles,
  MessageCircle,
  Settings,
  Brain,
  Search,
  Clock,
  Database,
  Activity,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════════
   AI PERSONALITIES
   ═══════════════════════════════════════════════════════════════════════════════ */
const AI_PERSONALITIES = {
  casual: {
    name: 'Chill Friend',
    icon: MessageSquare,
    emoji: '😊',
    description: 'Your relaxed buddy who knows your life inside out',
    tagline: 'Warm · Supportive · Encouraging',
    systemInstructions:
      'Mode: Casual. Be warm, supportive, and conversational like a friend who knows their life. Use contractions, light humor, and give gentle nudges. Celebrate wins and keep things encouraging.',
    gradient: 'from-orange-500 to-rose-500',
    glow: 'shadow-orange-500/25',
    activeBorder: 'border-orange-500',
    dotBg: 'bg-orange-500',
    bg: 'bg-orange-500/10',
  },
  personal: {
    name: 'Life Coach',
    icon: MessageCircle,
    emoji: '🧭',
    description: 'Connects your goals, habits & reflections meaningfully',
    tagline: 'Reflective · Insightful · Growth-focused',
    systemInstructions:
      'Mode: Personal. Be like a trusted mentor or life coach. Ask meaningful questions, connect actions to goals, acknowledge struggles, and provide thoughtful perspective from their data. Focus on growth and reflection.',
    gradient: 'from-violet-500 to-indigo-500',
    glow: 'shadow-violet-500/25',
    activeBorder: 'border-violet-500',
    dotBg: 'bg-violet-500',
    bg: 'bg-violet-500/10',
  },
  professional: {
    name: 'Strategist',
    icon: Zap,
    emoji: '⚡',
    description: 'Data-driven analysis from your habits, budget & goals',
    tagline: 'Precise · Analytical · Action-oriented',
    systemInstructions:
      'Mode: Professional. Be a competent executive assistant and productivity consultant. Provide clear analysis, structured recommendations, data-driven insights, and actionable plans. Focus on optimization and effectiveness.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/25',
    activeBorder: 'border-blue-500',
    dotBg: 'bg-blue-500',
    bg: 'bg-blue-500/10',
  },
};

// Chat Modes — maps to backend mode field
const CHAT_MODES = {
  normal: {
    label: 'Second Brain',
    shortLabel: 'Brain',
    icon: Brain,
    emoji: '🧠',
    description: 'Full context — uses your profile, habits, goals, notes, finances & memories',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    activeBg: 'bg-emerald-500/15',
  },
  chat_buddy: {
    label: 'Discovery',
    shortLabel: 'Discover',
    icon: Sparkles,
    emoji: '✨',
    description: 'Gets to know you — builds your AI profile through conversation',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    activeBg: 'bg-amber-500/15',
  },
} as const;

// RAG context sources the AI pulls from
const CONTEXT_SOURCES = [
  { label: 'Profile', icon: '👤' },
  { label: 'Habits', icon: '🔥' },
  { label: 'Goals', icon: '🎯' },
  { label: 'Finance', icon: '💰' },
  { label: 'Notes', icon: '📝' },
  { label: 'Memories', icon: '🧠' },
];

const SUGGESTED_PROMPTS = [
  { text: 'What patterns do you see in my habits?', icon: '🔍' },
  { text: 'Summarize my week across all areas', icon: '📊' },
  { text: 'How am I doing on my goals?', icon: '🎯' },
  { text: 'Give me a personalized motivation boost', icon: '🚀' },
  { text: 'Analyze my spending this month', icon: '💳' },
  { text: 'Help me plan tomorrow based on my priorities', icon: '📅' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  personality: keyof typeof AI_PERSONALITIES;
  customInstructions?: string;
  createdAt: Date;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
function groupSessionsByDate(sessions: ChatSession[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Last 7 days', items: [] },
    { label: 'Earlier', items: [] },
  ];

  sessions.forEach((s) => {
    const d = new Date(s.createdAt);
    if (d >= todayStart) groups[0].items.push(s);
    else if (d >= yesterdayStart) groups[1].items.push(s);
    else if (d >= weekStart) groups[2].items.push(s);
    else groups[3].items.push(s);
  });

  return groups.filter((g) => g.items.length > 0);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
          style={{
            animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */
function AiChatContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // ── State ──
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMode, setChatMode] = useState<'normal' | 'chat_buddy'>('normal');
  const [selectedPersonality, setSelectedPersonality] =
    useState<keyof typeof AI_PERSONALITIES>('casual');
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [aiSettings] = useState({
    defaultPersonality: 'casual' as keyof typeof AI_PERSONALITIES,
    preferredModel: '',
    enableContextMemory: true,
    maxContextLength: 10,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = `ai_chat_sessions_${user?.uid || 'guest'}`;
  const CURRENT_SESSION_KEY = `ai_chat_current_${user?.uid || 'guest'}`;

  // ── Storage ──
  const saveSessions = useCallback(
    (s: ChatSession[]) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      } catch {}
    },
    [STORAGE_KEY]
  );

  const loadSessions = useCallback((): ChatSession[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
      }
    } catch {}
    return [];
  }, [STORAGE_KEY]);

  const saveCurrentId = useCallback(
    (id: string | null) => {
      try {
        id
          ? localStorage.setItem(CURRENT_SESSION_KEY, id)
          : localStorage.removeItem(CURRENT_SESSION_KEY);
      } catch {}
    },
    [CURRENT_SESSION_KEY]
  );

  const loadCurrentId = useCallback((): string | null => {
    try {
      return localStorage.getItem(CURRENT_SESSION_KEY);
    } catch {
      return null;
    }
  }, [CURRENT_SESSION_KEY]);

  // ── Effects ──
  useEffect(() => {
    if (!user) return;
    const loaded = loadSessions();
    if (loaded.length > 0) {
      setSessions(loaded);
      const savedId = loadCurrentId();
      if (savedId && loaded.find((s) => s.id === savedId)) setCurrentSessionId(savedId);
    }
  }, [user, loadSessions, loadCurrentId]);

  // Override AppLayout for chat: kill outer scroll, fill width, hide bottom nav + FAB
  useEffect(() => {
    const main = document.querySelector('main');
    const wrapper = main?.parentElement;

    // Add class to body so we can target elements with CSS
    document.body.classList.add('chat-page-active');

    // Inject a style tag to reliably hide bottom nav and floating button
    const style = document.createElement('style');
    style.id = 'chat-page-overrides';
    style.textContent = `
      .chat-page-active nav[class*="fixed"][class*="bottom-0"] { display: none !important; }
      .chat-page-active button[class*="fixed"][class*="bottom-20"] { display: none !important; }
    `;
    document.head.appendChild(style);

    if (main) {
      main.style.overflow = 'hidden';
      main.style.padding = '0';
      main.style.maxWidth = 'none';
      main.style.margin = '0';
      main.style.width = '100%';
    }
    if (wrapper) {
      wrapper.style.overflow = 'hidden';
    }

    return () => {
      document.body.classList.remove('chat-page-active');
      style.remove();
      if (main) {
        main.style.overflow = '';
        main.style.padding = '';
        main.style.maxWidth = '';
        main.style.margin = '';
        main.style.width = '';
      }
      if (wrapper) {
        wrapper.style.overflow = '';
      }
    };
  }, []);

  useEffect(() => {
    if (user && sessions.length > 0) saveSessions(sessions);
  }, [sessions, user, saveSessions]);

  useEffect(() => {
    if (user) saveCurrentId(currentSessionId);
  }, [currentSessionId, user, saveCurrentId]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [currentSession?.messages, currentSession?.messages?.length]);

  useEffect(() => {
    if (currentSession?.personality) setSelectedPersonality(currentSession.personality);
  }, [currentSession?.personality]);

  useEffect(() => {
    const p = searchParams?.get('personality');
    if (p && p in AI_PERSONALITIES) {
      setSelectedPersonality(p as keyof typeof AI_PERSONALITIES);
      setTimeout(() => createNewSession(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && inputRef.current) inputRef.current.focus();
  }, [currentSessionId, isLoading, currentSession?.messages?.length]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, []);

  // ── Session Actions ──
  const createNewSession = () => {
    const p = selectedPersonality;
    const s: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Chat with ${AI_PERSONALITIES[p].name}`,
      messages: [],
      personality: p,
      createdAt: new Date(),
    };
    setSessions((prev) => [s, ...prev]);
    setCurrentSessionId(s.id);
    setIsTemporaryChat(false);
    setIsMobileSidebarOpen(false);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
    toast({ title: 'Chat Deleted', description: 'Session removed.' });
  };

  const clearAllSessions = () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    setSessions([]);
    setCurrentSessionId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_SESSION_KEY);
    } catch {}
    toast({ title: 'All Chats Cleared' });
  };

  const copyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
    toast({ title: 'Copied!' });
  };

  const startRename = (id: string, title: string) => {
    setEditingSessionId(id);
    setEditingTitle(title);
  };
  const saveRename = (id: string) => {
    if (editingTitle.trim())
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editingTitle.trim() } : s))
      );
    setEditingSessionId(null);
    setEditingTitle('');
  };
  const cancelRename = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const toggleTemporaryChat = () => {
    setIsTemporaryChat((p) => !p);
    setCurrentSessionId(null);
    setSessions((prev) => prev.filter((s) => s.id !== 'temp'));
    setIsMobileSidebarOpen(false);
  };

  // ── Send Message ──
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'You need to be logged in to chat.',
        variant: 'destructive',
      });
      return;
    }

    let session = currentSession;
    if (!session && !isTemporaryChat) {
      const ns: ChatSession = {
        id: `session-${Date.now()}`,
        title: `Chat with ${AI_PERSONALITIES[selectedPersonality].name}`,
        messages: [],
        personality: selectedPersonality,
        createdAt: new Date(),
      };
      setSessions((prev) => [ns, ...prev]);
      setCurrentSessionId(ns.id);
      session = ns;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };
    const effectiveId = isTemporaryChat ? 'temp' : session!.id;

    if (isTemporaryChat) {
      if (!currentSession) {
        const tempSession: ChatSession = {
          id: 'temp',
          title: 'Temporary Chat',
          messages: [userMsg],
          personality: selectedPersonality,
          createdAt: new Date(),
        };
        setSessions(() => [tempSession]);
        setCurrentSessionId('temp');
        session = tempSession;
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === 'temp' ? { ...s, messages: [...s.messages, userMsg] } : s
          )
        );
      }
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === session!.id ? { ...s, messages: [...s.messages, userMsg] } : s
        )
      );
    }

    setMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    const aiMsgId = `msg-${Date.now()}-ai`;
    const aiPlaceholder: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setSessions((prev) =>
      prev.map((s) =>
        s.id === effectiveId
          ? { ...s, messages: [...s.messages, aiPlaceholder] }
          : s
      )
    );

    try {
      const systemInstructions =
        AI_PERSONALITIES[selectedPersonality].systemInstructions;
      const contextMessages = aiSettings.enableContextMemory
        ? (session?.messages || []).slice(-aiSettings.maxContextLength)
        : [];
      const normalizedMessages = [
        { role: 'system', content: systemInstructions },
        ...contextMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: userMsg.role, content: userMsg.content },
      ];

      const token = await user.getIdToken();
      const body = {
        messages: normalizedMessages,
        ...(aiSettings.preferredModel.trim()
          ? { model: aiSettings.preferredModel.trim() }
          : {}),
        mode: chatMode,
      };

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({}));
        throw new Error(
          (err as any).error || `Request failed: ${response.status}`
        );
      }

      setIsLoading(false);
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullContent = '';
      let isDone = false;

      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trimEnd();
          if (trimmed.startsWith('data:')) {
            const rawData = trimmed.slice(5);
            let data = rawData;
            try {
              const parsed = JSON.parse(rawData);
              if (typeof parsed === 'string') data = parsed;
            } catch {}
            if (data === '[DONE]') {
              isDone = true;
              break;
            }
            if (data) {
              fullContent += data.replace(/\\n/g, '\n');
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === effectiveId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === aiMsgId
                            ? { ...m, content: fullContent }
                            : m
                        ),
                      }
                    : s
                )
              );
            }
          }
        }
      }

      reader.cancel();
      if (!fullContent) throw new Error('No content received from AI');
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorContent = `⚠️ **Error**: ${error.message || 'Failed to get AI response'}\n\nPlease try again.`;
      setSessions((prev) =>
        prev.map((s) =>
          s.id === effectiveId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, content: errorContent } : m
                ),
              }
            : s
        )
      );
      toast({
        title: 'Chat Error',
        description: error.message || 'Failed to get AI response.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // ── Derived ──
  const personality = AI_PERSONALITIES[selectedPersonality];
  const PersonalityIcon = personality.icon;
  const nonTempSessions = sessions.filter((s) => s.id !== 'temp');
  const filteredSessions = sidebarSearch.trim()
    ? nonTempSessions.filter((s) =>
        s.title.toLowerCase().includes(sidebarSearch.toLowerCase())
      )
    : nonTempSessions;
  const groupedSessions = groupSessionsByDate(filteredSessions);
  const hasMessages = (currentSession?.messages?.length ?? 0) > 0;

  /* ═══════════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════════ */
  return (
    <AppLayout>
      {/* Inject keyframes */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .msg-enter { animation: msgIn 0.2s ease-out forwards; }
        .blink-cursor::after {
          content: '▋';
          display: inline;
          animation: blink 1s step-end infinite;
          color: currentColor;
          font-weight: normal;
          margin-left: 1px;
        }
      `}</style>

      {/*
       * CRITICAL LAYOUT FIX:
       * The AppLayout wraps children in <main> with px/py and overflow.
       * We use negative margins + h-[calc] to break out of that padding
       * and create a fully contained flex layout where ONLY the messages scroll.
       *
       * On mobile: h-[calc(100vh - 48px_topbar - 56px_bottomnav)] = 100vh - 104px
       * On desktop: h-[calc(100vh - 48px_topbar)] = 100vh - 48px
       */}
      <div
        className={cn(
          'flex overflow-hidden w-full',
          // Fill height: viewport minus top header (48px). Bottom nav is hidden on chat.
          'h-[calc(100vh-48px)]'
        )}
      >
        {/* ═════════════════════════════════════════════════════════════════════
            MOBILE SIDEBAR BACKDROP
            ═════════════════════════════════════════════════════════════════════ */}
        {isMobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            SIDEBAR
            ═════════════════════════════════════════════════════════════════════ */}
        <aside
          className={cn(
            'flex flex-col bg-card border-r border-border/60 overflow-hidden',
            // Mobile: overlay panel
            'fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-200 ease-out',
            // Desktop: static, always visible
            'md:relative md:inset-auto md:z-auto md:translate-x-0 md:w-72 md:shrink-0',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-3 pt-3 pb-1 shrink-0">
            <span className="text-sm font-semibold text-foreground/80">AI Chat</span>
            <button
              className="md:hidden rounded-lg p-1 hover:bg-muted transition-colors"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="px-3 space-y-1.5 py-2 shrink-0">
            <button
              onClick={createNewSession}
              className="group w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 active:scale-[0.97]"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
              New Chat
            </button>

            <button
              onClick={toggleTemporaryChat}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all active:scale-[0.97]',
                isTemporaryChat
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400'
                  : 'bg-transparent border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Sparkles className={cn('h-3.5 w-3.5', isTemporaryChat && 'text-amber-500')} />
              {isTemporaryChat ? 'Exit Temporary' : 'Temporary Chat'}
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
              <input
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search chats…"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          {/* Session List — this is the ONLY scrollable part of sidebar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 min-h-0">
            {nonTempSessions.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/25" />
                <p className="text-xs text-muted-foreground/50">No chats yet</p>
                <p className="text-[11px] text-muted-foreground/35">
                  Start a new conversation!
                </p>
              </div>
            ) : groupedSessions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground/50">
                  No results for &ldquo;{sidebarSearch}&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-2">
                {groupedSessions.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-1.5 px-1 mb-1">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground/35" />
                      <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
                        {group.label}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {group.items.map((session) => {
                        const p = AI_PERSONALITIES[session.personality];
                        const isActive = currentSessionId === session.id;
                        return (
                          <div
                            key={session.id}
                            className={cn(
                              'group relative flex items-start gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-100',
                              isActive
                                ? 'bg-primary/10'
                                : 'hover:bg-muted/50'
                            )}
                            onClick={() => {
                              if (editingSessionId === session.id) return;
                              setCurrentSessionId(session.id);
                              setIsTemporaryChat(false);
                              setSelectedPersonality(session.personality);
                              setIsMobileSidebarOpen(false);
                            }}
                          >
                            {/* Color strip */}
                            <div
                              className={cn(
                                'w-0.5 rounded-full self-stretch mt-0.5 shrink-0',
                                p.dotBg,
                                isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'
                              )}
                            />

                            <div className="flex-1 min-w-0 overflow-hidden">
                              {editingSessionId === session.id ? (
                                <div
                                  className="flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="flex-1 min-w-0 text-xs bg-background border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveRename(session.id);
                                      if (e.key === 'Escape') cancelRename();
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => saveRename(session.id)}
                                    className="p-0.5 hover:text-primary shrink-0"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={cancelRename}
                                    className="p-0.5 hover:text-destructive shrink-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs font-medium truncate">{session.title}</p>
                                  <p className="text-[10px] text-muted-foreground/45 mt-0.5 truncate">
                                    {session.messages.length} msg ·{' '}
                                    {new Date(session.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Hover actions */}
                            {editingSessionId !== session.id && (
                              <div
                                className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  onClick={() => startRename(session.id, session.title)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteSession(session.id)}
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

          {/* Sidebar Footer */}
          {nonTempSessions.length > 0 && (
            <div className="px-3 py-2 border-t border-border/30 shrink-0">
              <button
                onClick={clearAllSessions}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-muted-foreground/50 hover:text-destructive transition-colors rounded-lg hover:bg-destructive/5"
              >
                <Trash2 className="h-3 w-3" />
                Clear all history
              </button>
            </div>
          )}
        </aside>

        {/* ═════════════════════════════════════════════════════════════════════
            MAIN CHAT AREA
            layout: header (shrink-0) + messages (flex-1 overflow-y-auto) + input (shrink-0)
            ═════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Chat Header ── */}
          <header className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/50 bg-background shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Mobile hamburger */}
              <button
                className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Personality orb */}
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  isTemporaryChat
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                    : `bg-gradient-to-br ${personality.gradient}`
                )}
              >
                {isTemporaryChat ? (
                  <Sparkles className="h-4 w-4 text-white" />
                ) : (
                  <PersonalityIcon className="h-4 w-4 text-white" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-sm leading-tight truncate">
                  {isTemporaryChat
                    ? 'Temporary Chat'
                    : currentSession?.title || `Chat with ${personality.name}`}
                </h2>
                <p className="text-[11px] text-muted-foreground/60 leading-tight truncate">
                  {isTemporaryChat
                    ? "Won't be saved"
                    : `${currentSession?.messages.length || 0} messages · ${personality.name} · ${CHAT_MODES[chatMode].label}`}
                </p>
              </div>
            </div>

            {/* Header right */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() =>
                  setChatMode((m) => (m === 'normal' ? 'chat_buddy' : 'normal'))
                }
                className={cn(
                  'hidden sm:flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all',
                  chatMode === 'chat_buddy'
                    ? cn(CHAT_MODES.chat_buddy.bg, CHAT_MODES.chat_buddy.border, CHAT_MODES.chat_buddy.color)
                    : cn(CHAT_MODES.normal.bg, CHAT_MODES.normal.border, CHAT_MODES.normal.color)
                )}
              >
                {(() => { const M = CHAT_MODES[chatMode]; const MIcon = M.icon; return (<><MIcon className="h-3 w-3" /> {M.shortLabel}</>); })()}
              </button>

              {isTemporaryChat && (
                <Badge
                  variant="outline"
                  className="hidden sm:flex items-center gap-1 text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10 text-[10px]"
                >
                  <Sparkles className="h-2.5 w-2.5" /> Ephemeral
                </Badge>
              )}

              <Link href="/ai-chat/memories">
                <button
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="AI Memories"
                >
                  <Brain className="h-4 w-4" />
                </button>
              </Link>

            </div>
          </header>

          {/* ── Messages — THIS IS THE ONLY PART THAT SCROLLS ── */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-5 py-4 space-y-1">

              {/* ── Welcome Screen ── */}
              {!hasMessages && !isTemporaryChat && (
                <div className="py-6 sm:py-10 space-y-8">
                  {/* Hero */}
                  <div className="text-center space-y-3">
                    <div className="relative inline-flex">
                      <div
                        className={cn(
                          'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-xl',
                          `bg-gradient-to-br ${personality.gradient}`
                        )}
                      >
                        <PersonalityIcon className="h-9 w-9 sm:h-11 sm:w-11 text-white" />
                      </div>
                      <div
                        className={cn(
                          'absolute inset-0 rounded-2xl opacity-20',
                          `bg-gradient-to-br ${personality.gradient}`
                        )}
                        style={{
                          animation: 'ping 2.5s cubic-bezier(0,0,0.2,1) infinite',
                        }}
                      />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      Chat with {personality.name}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {personality.description} {personality.emoji}
                    </p>
                    {/* RAG context sources */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                      <Database className="h-3 w-3 text-muted-foreground/40" />
                      {CONTEXT_SOURCES.map((src) => (
                        <span
                          key={src.label}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground/70 border border-border/30"
                        >
                          <span>{src.icon}</span> {src.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Personality Picker */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest text-center">
                      Choose Personality
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl mx-auto">
                      {Object.entries(AI_PERSONALITIES).map(([key, p]) => {
                        const Icon = p.icon;
                        const isSelected = selectedPersonality === key;
                        return (
                          <button
                            key={key}
                            onClick={() =>
                              setSelectedPersonality(
                                key as keyof typeof AI_PERSONALITIES
                              )
                            }
                            className={cn(
                              'relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 active:scale-[0.98]',
                              isSelected
                                ? cn(p.activeBorder, p.bg, 'shadow-lg', p.glow)
                                : 'border-border/40 hover:border-border bg-card hover:bg-muted/30'
                            )}
                          >
                            <div
                              className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                                `bg-gradient-to-br ${p.gradient}`
                              )}
                            >
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{p.name}</p>
                              <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
                                {p.tagline}
                              </p>
                            </div>
                            {isSelected && (
                              <div
                                className={cn(
                                  'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center',
                                  `bg-gradient-to-br ${p.gradient}`
                                )}
                              >
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chat Mode */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest text-center">
                      Chat Mode
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                      {(Object.entries(CHAT_MODES) as [keyof typeof CHAT_MODES, typeof CHAT_MODES[keyof typeof CHAT_MODES]][]).map(([modeKey, modeInfo]) => {
                        const ModeIcon = modeInfo.icon;
                        const isActive = chatMode === modeKey;
                        return (
                          <button
                            key={modeKey}
                            onClick={() => setChatMode(modeKey)}
                            className={cn(
                              'relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-150 active:scale-[0.98]',
                              isActive
                                ? cn(modeInfo.border, modeInfo.activeBg, 'shadow-md')
                                : 'border-border/40 hover:border-border bg-card hover:bg-muted/30'
                            )}
                          >
                            <div className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                              isActive ? modeInfo.bg : 'bg-muted/60'
                            )}>
                              <ModeIcon className={cn('h-4 w-4', isActive ? modeInfo.color : 'text-muted-foreground')} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {modeInfo.emoji} {modeInfo.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">
                                {modeInfo.description}
                              </p>
                            </div>
                            {isActive && (
                              <div className="absolute top-2 right-2">
                                <Activity className={cn('h-3.5 w-3.5', modeInfo.color)} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suggested Prompts */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest text-center">
                      Try Asking
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                      {SUGGESTED_PROMPTS.map((sp) => (
                        <button
                          key={sp.text}
                          onClick={() => {
                            setMessage(sp.text);
                            inputRef.current?.focus();
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-card hover:bg-muted/40 hover:border-primary/30 text-left text-sm transition-all group active:scale-[0.98]"
                        >
                          <span className="text-lg shrink-0">{sp.icon}</span>
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                            {sp.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Temporary Chat Welcome ── */}
              {!hasMessages && isTemporaryChat && (
                <div className="py-8 sm:py-12 space-y-6">
                  <div className="text-center space-y-3">
                    <div className="relative inline-flex">
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl">
                        <Sparkles className="h-9 w-9 text-white" />
                      </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      Temporary Chat
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      This conversation won&apos;t be saved. Perfect for sensitive or
                      one-time questions.
                    </p>
                    <Badge
                      variant="outline"
                      className="text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10"
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> Ephemeral Mode
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                    {SUGGESTED_PROMPTS.map((sp) => (
                      <button
                        key={sp.text}
                        onClick={() => {
                          setMessage(sp.text);
                          inputRef.current?.focus();
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-card hover:bg-muted/40 hover:border-amber-500/30 text-left text-sm transition-all group active:scale-[0.98]"
                      >
                        <span className="text-lg shrink-0">{sp.icon}</span>
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                          {sp.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Chat Messages ── */}
              {currentSession?.messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const isLastAi =
                  !isUser && idx === currentSession.messages.length - 1;
                const showCursor = isLastAi && isStreaming && msg.content.length > 0;
                const showTyping = isLastAi && isLoading && msg.content.length === 0;
                const isCopied = copiedMsgId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'group flex flex-col msg-enter mb-5',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    {/* Avatar + name row */}
                    <div
                      className={cn(
                        'flex items-center gap-2 mb-1',
                        isUser ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                          isUser
                            ? 'bg-primary'
                            : `bg-gradient-to-br ${personality.gradient}`
                        )}
                      >
                        {isUser ? (
                          <User className="h-3.5 w-3.5 text-primary-foreground" />
                        ) : (
                          <PersonalityIcon className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground/60">
                        {isUser ? 'You' : personality.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div
                      className={cn(
                        'relative rounded-2xl px-4 py-3',
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-tr-sm max-w-[85%] sm:max-w-[75%]'
                          : 'bg-card border border-border/40 rounded-tl-sm max-w-[90%] sm:max-w-[80%]'
                      )}
                    >
                      {showTyping ? (
                        <TypingDots />
                      ) : isUser ? (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                          {msg.content}
                        </p>
                      ) : (
                        <div
                          className={cn(
                            'text-sm leading-relaxed break-words overflow-hidden',
                            // Prose styling for readable markdown
                            '[&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all [&_img]:max-w-full [&_table]:text-xs'
                          )}
                        >
                          <MarkdownRenderer content={msg.content} />
                          {showCursor && (
                            <span className="blink-cursor" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Copy button — always below bubble, visible on hover */}
                    {msg.content && !showTyping && (
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        className={cn(
                          'flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] transition-all',
                          'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/60',
                          'opacity-0 group-hover:opacity-100',
                          isCopied && 'opacity-100 text-primary'
                        )}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-2.5 w-2.5" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-2.5 w-2.5" /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Thinking indicator (before streaming starts) */}
              {isLoading && !isStreaming && !currentSession?.messages?.some(m => m.role === 'assistant' && m.content === '') && (
                <div className="flex flex-col items-start mb-5 msg-enter">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center',
                        `bg-gradient-to-br ${personality.gradient}`
                      )}
                    >
                      <PersonalityIcon className="h-3.5 w-3.5 text-white animate-pulse" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground/60">
                      {personality.name}
                    </span>
                  </div>
                  <div className="bg-card border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>
          </div>

          {/* ── Input Bar — ALWAYS at bottom, never scrolls ── */}
          <div
            className={cn(
              'shrink-0 border-t bg-background px-3 sm:px-4 py-2.5',
              chatMode === 'chat_buddy'
                ? 'border-t-amber-500/30'
                : isTemporaryChat
                  ? 'border-t-amber-500/20'
                  : 'border-t-border/50'
            )}
          >
            <div className="max-w-3xl mx-auto">
              {/* Input container */}
              <div
                className={cn(
                  'flex items-end gap-2 px-1 rounded-2xl border-2 transition-colors bg-muted/15',
                  chatMode === 'chat_buddy'
                    ? 'border-amber-500/25 focus-within:border-amber-500/50'
                    : isTemporaryChat
                      ? 'border-amber-500/20 focus-within:border-amber-500/40'
                      : 'border-border/40 focus-within:border-primary/50'
                )}
              >
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    autoResize();
                  }}
                  placeholder={`Message ${isTemporaryChat ? 'anonymously' : personality.name}…`}
                  rows={1}
                  className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm focus:outline-none placeholder:text-muted-foreground/35 leading-relaxed resize-none overflow-y-auto"
                  style={{ minHeight: '40px', maxHeight: '140px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />

                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  className={cn(
                    'shrink-0 w-9 h-9 mb-1 mr-0.5 rounded-xl flex items-center justify-center transition-all active:scale-95',
                    message.trim() && !isLoading
                      ? cn(
                          `bg-gradient-to-br ${personality.gradient}`,
                          'text-white shadow hover:opacity-90'
                        )
                      : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {/* Footer hints */}
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[10px] text-muted-foreground/35 select-none">
                  {isTemporaryChat
                    ? '🔒 Not saved'
                    : '↵ Send · Shift+↵ new line'}
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Compact mode toggle */}
                  {(() => {
                    const M = CHAT_MODES[chatMode];
                    const MIcon = M.icon;
                    return (
                      <button
                        onClick={() =>
                          setChatMode((m) =>
                            m === 'normal' ? 'chat_buddy' : 'normal'
                          )
                        }
                        className={cn(
                          'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all',
                          M.border, M.color, M.bg
                        )}
                      >
                        <MIcon className="h-2.5 w-2.5" /> {M.shortLabel}
                      </button>
                    );
                  })()}
                  {isTemporaryChat && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-medium">
                      Temp
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE EXPORT
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AiChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <AiChatContent />
    </Suspense>
  );
}