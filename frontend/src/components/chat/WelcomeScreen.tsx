'use client';

import { useMemo } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AI_PERSONALITIES,
  CHAT_MODES,
  SUGGESTED_PROMPTS,
} from './chat-constants';

interface WelcomeScreenProps {
  isTemporaryChat: boolean;
  selectedPersonality: keyof typeof AI_PERSONALITIES;
  chatMode: 'normal' | 'chat_buddy';
  onSelectPersonality: (key: keyof typeof AI_PERSONALITIES) => void;
  onSelectMode: (mode: 'normal' | 'chat_buddy') => void;
  onSelectPrompt: (text: string) => void;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function WelcomeScreen({
  isTemporaryChat,
  selectedPersonality,
  chatMode,
  onSelectPersonality,
  onSelectMode,
  onSelectPrompt,
}: WelcomeScreenProps) {
  const personality = AI_PERSONALITIES[selectedPersonality];
  const PersonalityIcon = personality.icon;
  const greeting = useMemo(() => getGreeting(), []);

  // ── Temporary chat ──
  if (isTemporaryChat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] px-4">
        <div className="max-w-lg w-full space-y-8">
          {/* Icon + heading */}
          <div className="text-center space-y-3">
            <div className="relative mx-auto w-16 h-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                <span className="text-[10px] text-white">!</span>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Temporary Chat</h1>
            <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
              Nothing from this session will be saved. Ask anything freely.
            </p>
          </div>

          {/* Quick prompts as cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {SUGGESTED_PROMPTS.slice(0, 4).map((sp) => (
              <button
                key={sp.text}
                onClick={() => onSelectPrompt(sp.text)}
                className="group relative p-4 rounded-2xl border border-border/30 bg-card/60 hover:bg-card hover:border-border/60 hover:shadow-md text-left transition-all duration-200 active:scale-[0.98]"
              >
                <span className="text-lg mb-2 block">{sp.icon}</span>
                <span className="text-[13px] leading-snug text-muted-foreground/70 group-hover:text-foreground transition-colors">
                  {sp.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main welcome ──
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] px-4">
      <div className="max-w-xl w-full space-y-8">

        {/* Greeting hero */}
        <div className="text-center space-y-2">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div
              className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg',
                `bg-gradient-to-br ${personality.gradient}`,
                personality.glow
              )}
            >
              <PersonalityIcon className="h-7 w-7 text-white" />
            </div>
            {/* Online dot */}
            <div className={cn(
              'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background',
              personality.dotBg
            )} />
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm text-muted-foreground/50">
            I&apos;m your {personality.name.toLowerCase()}. How can I help today?
          </p>
        </div>

        {/* Personality quick switch — compact pill row */}
        <div className="flex items-center justify-center gap-1.5">
          {Object.entries(AI_PERSONALITIES).map(([key, p]) => {
            const Icon = p.icon;
            const isActive = selectedPersonality === key;
            return (
              <button
                key={key}
                onClick={() => onSelectPersonality(key as keyof typeof AI_PERSONALITIES)}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-all duration-200',
                  isActive
                    ? cn('text-foreground shadow-sm border', p.bg, p.activeBorder)
                    : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/40'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  `bg-gradient-to-br ${p.gradient}`
                )}>
                  <Icon className="h-2.5 w-2.5 text-white" />
                </div>
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Mode switch — inline toggle */}
        <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-muted/30 w-fit mx-auto">
          {(Object.entries(CHAT_MODES) as [keyof typeof CHAT_MODES, typeof CHAT_MODES[keyof typeof CHAT_MODES]][]).map(([modeKey, modeInfo]) => {
            const ModeIcon = modeInfo.icon;
            const isActive = chatMode === modeKey;
            return (
              <button
                key={modeKey}
                onClick={() => onSelectMode(modeKey)}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground/50 hover:text-muted-foreground'
                )}
              >
                <ModeIcon className={cn('h-3.5 w-3.5', isActive && modeInfo.color)} />
                {modeInfo.label}
              </button>
            );
          })}
        </div>

        {/* Suggestion cards — 2x3 grid with icons */}
        <div className="grid grid-cols-2 gap-2.5">
          {SUGGESTED_PROMPTS.map((sp) => (
            <button
              key={sp.text}
              onClick={() => onSelectPrompt(sp.text)}
              className="group relative p-4 rounded-2xl border border-border/25 bg-card/40 hover:bg-card/80 hover:border-border/50 hover:shadow-md text-left transition-all duration-200 active:scale-[0.98]"
            >
              <span className="text-base mb-2 block opacity-70 group-hover:opacity-100 transition-opacity">{sp.icon}</span>
              <span className="text-[13px] leading-snug text-muted-foreground/60 group-hover:text-foreground/80 transition-colors">
                {sp.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
