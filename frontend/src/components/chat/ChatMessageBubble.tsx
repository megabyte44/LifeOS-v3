'use client';

import { User, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { AI_PERSONALITIES } from './chat-constants';

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2 px-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-primary/40"
          style={{
            animation: `typingBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

interface ChatMessageBubbleProps {
  msg: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
  personality: keyof typeof AI_PERSONALITIES;
  isLastAi: boolean;
  isStreaming: boolean;
  isLoading: boolean;
  copiedMsgId: string | null;
  onCopy: (id: string, content: string) => void;
}

export function ChatMessageBubble({
  msg,
  personality,
  isLastAi,
  isStreaming,
  isLoading,
  copiedMsgId,
  onCopy,
}: ChatMessageBubbleProps) {
  const p = AI_PERSONALITIES[personality];
  const PersonalityIcon = p.icon;
  const isUser = msg.role === 'user';
  const showCursor = isLastAi && isStreaming && msg.content.length > 0;
  const showTyping = isLastAi && isLoading && msg.content.length === 0;
  const isCopied = copiedMsgId === msg.id;

  // ── User message ──
  if (isUser) {
    return (
      <div className="group msg-enter flex justify-end">
        <div className="flex items-start gap-2.5 flex-row-reverse max-w-[85%] sm:max-w-[75%]">
          {/* User avatar */}
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>

          <div className="min-w-0">
            {/* Bubble */}
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2.5 shadow-sm">
              <p className="text-[14px] whitespace-pre-wrap leading-relaxed break-words">
                {msg.content}
              </p>
            </div>
            {/* Hover actions */}
            <div className="flex items-center justify-end gap-2 mt-1 h-5">
              <span className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/30 transition-colors select-none tabular-nums">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={() => onCopy(msg.id, msg.content)}
                className={cn(
                  'p-0.5 rounded transition-all',
                  isCopied
                    ? 'text-primary opacity-100'
                    : 'text-muted-foreground/0 group-hover:text-muted-foreground/40 hover:!text-muted-foreground'
                )}
              >
                {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AI message ──
  return (
    <div className="group msg-enter">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm',
            `bg-gradient-to-br ${p.gradient}`
          )}
        >
          <PersonalityIcon className={cn('h-3.5 w-3.5 text-white', showTyping && 'animate-pulse')} />
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <span className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wide mb-1 block">
            {p.name}
          </span>

          {showTyping ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl rounded-tl-md bg-card border border-border/30">
              <TypingDots />
              <span className="text-xs text-muted-foreground/40">Thinking...</span>
            </div>
          ) : (
            <>
              {/* Message card */}
              <div className="rounded-2xl rounded-tl-md bg-card/70 border border-border/25 px-5 py-4 shadow-sm">
                <div
                  className={cn(
                    'text-[14px] leading-[1.75] break-words text-foreground/90',
                    '[&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-all [&_img]:max-w-full [&_table]:text-xs'
                  )}
                >
                  <MarkdownRenderer content={msg.content} />
                  {showCursor && <span className="blink-cursor" />}
                </div>
              </div>

              {/* Action bar */}
              {msg.content && (
                <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => onCopy(msg.id, msg.content)}
                    className={cn(
                      'flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium transition-colors',
                      isCopied
                        ? 'text-primary bg-primary/8'
                        : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/40'
                    )}
                  >
                    {isCopied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                  <span className="text-[10px] text-muted-foreground/20 tabular-nums ml-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { TypingDots };
