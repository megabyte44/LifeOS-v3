import {
  MessageSquare,
  Zap,
  MessageCircle,
  Brain,
  Sparkles,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════
   AI PERSONALITIES
   ═══════════════════════════════════════════════════════════════════════════════ */
export const AI_PERSONALITIES = {
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
} as const;

export const CHAT_MODES = {
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

export const CONTEXT_SOURCES = [
  { label: 'Profile', icon: '👤' },
  { label: 'Habits', icon: '🔥' },
  { label: 'Goals', icon: '🎯' },
  { label: 'Finance', icon: '💰' },
  { label: 'Notes', icon: '📝' },
  { label: 'Memories', icon: '🧠' },
];

export const SUGGESTED_PROMPTS = [
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
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  personality: keyof typeof AI_PERSONALITIES;
  mode?: 'normal' | 'chat_buddy';
  customInstructions?: string;
  createdAt: Date;
  lastMessageAt?: Date;
  messagesLoaded?: boolean;
}

/** Lightweight conversation metadata — used for the sidebar list (no messages). */
export interface ConversationSummary {
  id: string;
  title: string;
  personality: keyof typeof AI_PERSONALITIES;
  mode: 'normal' | 'chat_buddy';
  createdAt: Date;
  lastMessageAt: Date;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════════════ */
export function groupSessionsByDate(sessions: ChatSession[]) {
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

export function groupConversationsByDate(conversations: ConversationSummary[]) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  const groups: { label: string; items: ConversationSummary[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Last 7 days', items: [] },
    { label: 'Earlier', items: [] },
  ];

  conversations.forEach((c) => {
    const d = new Date(c.lastMessageAt);
    if (d >= todayStart) groups[0].items.push(c);
    else if (d >= yesterdayStart) groups[1].items.push(c);
    else if (d >= weekStart) groups[2].items.push(c);
    else groups[3].items.push(c);
  });

  return groups.filter((g) => g.items.length > 0);
}

export function normalizePersonality(value?: string): keyof typeof AI_PERSONALITIES {
  if (value && value in AI_PERSONALITIES) {
    return value as keyof typeof AI_PERSONALITIES;
  }
  return 'casual';
}
