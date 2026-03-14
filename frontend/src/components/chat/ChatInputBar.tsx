'use client';

import { useCallback, useEffect } from 'react';
import { Sparkles, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AI_PERSONALITIES, CHAT_MODES } from './chat-constants';

interface ChatInputBarProps {
  message: string;
  onMessageChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  isTemporaryChat: boolean;
  selectedPersonality: keyof typeof AI_PERSONALITIES;
  chatMode: 'normal' | 'chat_buddy';
  onToggleMode: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInputBar({
  message,
  onMessageChange,
  onSend,
  isLoading,
  isStreaming,
  isTemporaryChat,
  selectedPersonality,
  chatMode,
  onToggleMode,
  inputRef,
}: ChatInputBarProps) {
  const personality = AI_PERSONALITIES[selectedPersonality];
  const M = CHAT_MODES[chatMode];
  const MIcon = M.icon;

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [inputRef]);

  useEffect(() => {
    if (!isLoading && !isStreaming && inputRef.current) inputRef.current.focus();
  }, [isLoading, isStreaming, inputRef]);

  const canSend = message.trim() && !isLoading && !isStreaming;

  return (
    <div className="shrink-0 pb-4 pt-2 px-4 sm:px-6 bg-gradient-to-t from-background via-background to-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Input container */}
        <div
          className={cn(
            'relative rounded-2xl border transition-all duration-200',
            'bg-card shadow-sm',
            'focus-within:shadow-lg focus-within:shadow-primary/5',
            chatMode === 'chat_buddy'
              ? 'border-amber-500/20 focus-within:border-amber-500/40'
              : isTemporaryChat
                ? 'border-amber-300/20 focus-within:border-amber-400/30'
                : 'border-border/40 focus-within:border-primary/30'
          )}
        >
          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => {
              onMessageChange(e.target.value);
              autoResize();
            }}
            placeholder={
              isTemporaryChat
                ? 'Ask anything (not saved)...'
                : `Message ${personality.name}...`
            }
            rows={1}
            className="w-full bg-transparent px-4 pt-3.5 pb-14 text-[14px] focus:outline-none placeholder:text-muted-foreground/35 leading-relaxed resize-none overflow-y-auto"
            style={{ minHeight: '56px', maxHeight: '200px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
          />

          {/* Bottom toolbar */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* Mode pill */}
              <button
                onClick={onToggleMode}
                className={cn(
                  'flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium border transition-all',
                  M.border, M.color, M.bg,
                  'hover:brightness-110 active:scale-95'
                )}
              >
                <MIcon className="h-3 w-3" /> {M.shortLabel}
              </button>

              {isTemporaryChat && (
                <span className="flex items-center gap-1 text-[11px] h-7 px-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">
                  <Sparkles className="h-3 w-3" /> Temp
                </span>
              )}
            </div>

            {/* Send */}
            <button
              onClick={() => canSend && onSend()}
              disabled={!canSend}
              className={cn(
                'h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200',
                canSend
                  ? cn(`bg-gradient-to-br ${personality.gradient}`, 'text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-90')
                  : 'bg-muted/50 text-muted-foreground/25 cursor-not-allowed'
              )}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center mt-2">
          <span className="text-[10px] text-muted-foreground/25 select-none">
            {isTemporaryChat
              ? 'This chat won\'t be saved'
              : '↵ Send · Shift+↵ new line'}
          </span>
        </div>
      </div>
    </div>
  );
}
