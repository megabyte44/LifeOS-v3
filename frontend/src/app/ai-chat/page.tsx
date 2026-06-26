'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { PanelLeft, ArrowDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { aiChatService } from '@/services';
import {
  ChatSidebar,
  ChatMessageBubble,
  TypingDots,
  ChatInputBar,
  WelcomeScreen,
  AI_PERSONALITIES,
  normalizePersonality,
} from '@/components/chat';
import type { ChatMessage, ConversationSummary } from '@/components/chat';

function AiChatContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // ── Sidebar state (lightweight metadata only) ──
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  // ── Active chat state ──
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // ── Input / UI state ──
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMode, setChatMode] = useState<'normal' | 'chat_buddy'>('normal');
  const [selectedPersonality, setSelectedPersonality] =
    useState<keyof typeof AI_PERSONALITIES>('casual');
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [aiSettings] = useState({
    preferredModel: '',
    enableContextMemory: true,
    maxContextLength: 10,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ── Load conversation list on mount ──
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    try {
      const summaries = await aiChatService.listConversations();
      const mapped: ConversationSummary[] = summaries.map((s) => ({
        id: s.id,
        title: s.title,
        personality: normalizePersonality(s.personality),
        mode: (s.mode === 'chat_buddy' ? 'chat_buddy' : 'normal') as 'normal' | 'chat_buddy',
        createdAt: new Date(s.createdAt),
        lastMessageAt: new Date(s.lastMessageAt),
      }));
      setConversations(mapped);

      // Restore last-opened conversation from sessionStorage
      const lastId = sessionStorage.getItem('lastConversationId');
      if (lastId && mapped.some((c) => c.id === lastId)) {
        await selectConversationById(lastId, mapped);
      }
    } catch (err: any) {
      toast({ title: 'Failed to load conversations', description: err?.message, variant: 'destructive' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  // ── Select and lazy-load a conversation ──
  const selectConversationById = useCallback(async (
    id: string,
    convList?: ConversationSummary[]
  ) => {
    const list = convList ?? conversations;
    const conv = list.find((c) => c.id === id);
    if (!conv) return;

    setCurrentConversationId(id);
    setMessages([]);
    setMessagesLoading(true);
    setIsTemporaryChat(false);
    setSelectedPersonality(conv.personality);
    setChatMode(conv.mode ?? 'normal');
    setIsMobileSidebarOpen(false);

    try {
      const items = await aiChatService.getConversationMessages(id);
      const flatMessages: ChatMessage[] = items.flatMap((item) => {
        const ts = new Date(item.createdAt);
        return [
          { id: `${item.id}-u`, role: 'user' as const, content: item.userMessage, timestamp: ts },
          { id: `${item.id}-a`, role: 'assistant' as const, content: item.assistantMessage, timestamp: ts },
        ];
      });
      setMessages(flatMessages);
    } catch (err: any) {
      toast({ title: 'Failed to load messages', description: err?.message, variant: 'destructive' });
    } finally {
      setMessagesLoading(false);
      sessionStorage.setItem('lastConversationId', id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, toast]);

  // ── Override AppLayout for chat ──
  useEffect(() => {
    const main = document.querySelector('main');
    const wrapper = main?.parentElement;
    document.body.classList.add('chat-page-active');
    const style = document.createElement('style');
    style.id = 'chat-page-overrides';
    style.textContent = `
      .chat-page-active nav[class*="fixed"][class*="bottom-0"] { display: none !important; }
      .chat-page-active button[class*="fixed"][class*="bottom-20"] { display: none !important; }
    `;
    document.head.appendChild(style);
    if (main) { main.style.overflow = 'hidden'; main.style.padding = '0'; main.style.maxWidth = 'none'; main.style.margin = '0'; main.style.width = '100%'; }
    if (wrapper) wrapper.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('chat-page-active');
      style.remove();
      if (main) { main.style.overflow = ''; main.style.padding = ''; main.style.maxWidth = ''; main.style.margin = ''; main.style.width = ''; }
      if (wrapper) wrapper.style.overflow = '';
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    if (!isLoading && inputRef.current) inputRef.current.focus();
  }, [currentConversationId, isLoading, messages.length]);

  // Scroll position tracking
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 150);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const p = searchParams?.get('personality');
    if (p && p in AI_PERSONALITIES) {
      setSelectedPersonality(p as keyof typeof AI_PERSONALITIES);
      handleNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Chat actions ──
  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setIsTemporaryChat(false);
    setIsMobileSidebarOpen(false);
    sessionStorage.removeItem('lastConversationId');
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await aiChatService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) handleNewChat();
      toast({ title: 'Chat Deleted' });
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err?.message, variant: 'destructive' });
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all conversations? This cannot be undone.')) return;
    try {
      await aiChatService.deleteAllConversations();
      setConversations([]);
      handleNewChat();
      toast({ title: 'All conversations cleared' });
    } catch (err: any) {
      toast({ title: 'Clear Failed', description: err?.message, variant: 'destructive' });
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await aiChatService.renameConversation(id, newTitle);
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    } catch (err: any) {
      toast({ title: 'Rename Failed', description: err?.message, variant: 'destructive' });
    }
  };

  const toggleTemporaryChat = () => {
    setIsTemporaryChat((p) => !p);
    setCurrentConversationId(null);
    setMessages([]);
    setIsMobileSidebarOpen(false);
    sessionStorage.removeItem('lastConversationId');
  };

  const copyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
    toast({ title: 'Copied!' });
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  // ── Send message ──
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You need to be logged in to chat.', variant: 'destructive' });
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    // Add user message + AI placeholder optimistically
    const aiMsgId = `msg-${Date.now()}-ai`;
    const aiPlaceholder: ChatMessage = { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setMessage('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const systemInstructions = AI_PERSONALITIES[selectedPersonality].systemInstructions;
      const contextMessages = aiSettings.enableContextMemory
        ? messages.slice(-aiSettings.maxContextLength)
        : [];
      const normalizedMessages = [
        { role: 'system', content: systemInstructions },
        ...contextMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: userMsg.role, content: userMsg.content },
      ];

      const token = await user.getIdToken();
      const body = {
        messages: normalizedMessages,
        conversationId: isTemporaryChat ? undefined : currentConversationId,
        temporary: isTemporaryChat || undefined,
        ...(aiSettings.preferredModel.trim() ? { model: aiSettings.preferredModel.trim() } : {}),
        mode: chatMode,
      };

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error || `Request failed: ${response.status}`);
      }

      setIsLoading(false);
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullContent = '';
      let isDone = false;
      let currentEventName = '';

      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trimEnd();

          if (trimmed === '') {
            // SSE event boundary — reset event name
            currentEventName = '';
            continue;
          }

          if (trimmed.startsWith('event:')) {
            currentEventName = trimmed.slice(6).trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const rawData = trimmed.slice(5).trim();

            // Handle conversation_id meta-event (new or existing conversation)
            if (currentEventName === 'conversation_id') {
              let newId = rawData;
              try { const parsed = JSON.parse(rawData); if (typeof parsed === 'string') newId = parsed; } catch {}
              setCurrentConversationId(newId);
              sessionStorage.setItem('lastConversationId', newId);

              // Optimistically add/move to top of sidebar
              setConversations((prev) => {
                const exists = prev.some((c) => c.id === newId);
                if (!exists) {
                  const newConv: ConversationSummary = {
                    id: newId,
                    title: userMsg.content.slice(0, 60).replace(/\n/g, ' '),
                    personality: selectedPersonality,
                    mode: chatMode,
                    createdAt: new Date(),
                    lastMessageAt: new Date(),
                  };
                  return [newConv, ...prev];
                }
                // Move existing conversation to top and update lastMessageAt
                const updated = prev.map((c) =>
                  c.id === newId ? { ...c, lastMessageAt: new Date() } : c
                );
                return [updated.find((c) => c.id === newId)!, ...updated.filter((c) => c.id !== newId)];
              });
              currentEventName = '';
              continue;
            }

            // Standard token data
            let data = rawData;
            try {
              const parsed = JSON.parse(rawData);
              if (typeof parsed === 'string') data = parsed;
            } catch {}

            if (data === '[DONE]') { isDone = true; break; }
            if (data) {
              fullContent += data.replace(/\\n/g, '\n');
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
              );
            }
          }
        }
      }
      reader.cancel();
      if (!fullContent) throw new Error('No content received from AI');
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorContent = `**Error**: ${error.message || 'Failed to get AI response'}\n\nPlease try again.`;
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, content: errorContent } : m))
      );
      toast({ title: 'Chat Error', description: error.message || 'Failed to get AI response.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // ── Derived ──
  const personality = AI_PERSONALITIES[selectedPersonality];
  const PersonalityIcon = personality.icon;
  const hasMessages = messages.length > 0;

  return (
    <AppLayout>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        .msg-enter { animation: msgIn 0.25s ease-out forwards; }
        .blink-cursor::after { content:'▋'; display:inline; animation:blink 1s step-end infinite; color:hsl(var(--primary)); margin-left:2px; font-weight:400; }
        .chat-scrollbar::-webkit-scrollbar { width:5px; }
        .chat-scrollbar::-webkit-scrollbar-track { background:transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background:hsl(var(--border)/0.5); border-radius:99px; }
        .chat-scrollbar::-webkit-scrollbar-thumb:hover { background:hsl(var(--muted-foreground)/0.3); }
      `}</style>

      <div className="flex overflow-hidden w-full h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          isLoadingMessages={messagesLoading}
          isTemporaryChat={isTemporaryChat}
          isMobileOpen={isMobileSidebarOpen}
          sidebarSearch={sidebarSearch}
          onSearchChange={setSidebarSearch}
          onNewChat={handleNewChat}
          onToggleTemp={toggleTemporaryChat}
          onSelectConversation={(id) => { void selectConversationById(id); }}
          onDeleteConversation={(id) => { void handleDeleteConversation(id); }}
          onRenameConversation={(id, title) => { void handleRenameConversation(id, title); }}
          onClearAll={() => { void handleClearAll(); }}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

          {/* Minimal top bar — sidebar toggle on mobile only */}
          <div className="md:hidden flex items-center h-11 px-3 shrink-0 border-b border-border/20">
            <button
              className="p-1.5 -ml-1 rounded-lg hover:bg-muted/50 transition-colors"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <PanelLeft className="h-5 w-5 text-muted-foreground/60" />
            </button>
            <div className="flex items-center gap-2 ml-2 min-w-0">
              <div className={cn('w-5 h-5 rounded-md flex items-center justify-center shrink-0', `bg-gradient-to-br ${personality.gradient}`)}>
                <PersonalityIcon className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-medium truncate">
                {isTemporaryChat
                  ? 'Temporary Chat'
                  : currentConversationId
                  ? (conversations.find((c) => c.id === currentConversationId)?.title ?? personality.name)
                  : personality.name}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 chat-scrollbar"
          >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
              {!hasMessages && !messagesLoading && (
                <WelcomeScreen
                  isTemporaryChat={isTemporaryChat}
                  selectedPersonality={selectedPersonality}
                  chatMode={chatMode}
                  onSelectPersonality={setSelectedPersonality}
                  onSelectMode={setChatMode}
                  onSelectPrompt={(text) => { setMessage(text); inputRef.current?.focus(); }}
                />
              )}

              {/* Loading skeleton while messages fetch */}
              {messagesLoading && (
                <div className="flex flex-col gap-4 py-8 animate-pulse">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                      <div className={cn('h-10 rounded-2xl bg-muted/60', i % 2 === 0 ? 'w-48' : 'w-64')} />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-5">
                {messages.map((msg, idx) => (
                  <ChatMessageBubble
                    key={msg.id}
                    msg={msg}
                    personality={selectedPersonality}
                    isLastAi={msg.role === 'assistant' && idx === messages.length - 1}
                    isStreaming={isStreaming}
                    isLoading={isLoading}
                    copiedMsgId={copiedMsgId}
                    onCopy={copyMessage}
                  />
                ))}
              </div>

              {/* Standalone thinking indicator */}
              {isLoading && !isStreaming && !messages.some((m) => m.role === 'assistant' && m.content === '') && (
                <div className="flex items-start gap-3 msg-enter mt-5">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm', `bg-gradient-to-br ${personality.gradient}`)}>
                    <PersonalityIcon className="h-3.5 w-3.5 text-white animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wide mb-1 block">{personality.name}</span>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl rounded-tl-md bg-card border border-border/30">
                      <TypingDots />
                      <span className="text-xs text-muted-foreground/40">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>

          {/* Scroll to bottom */}
          {showScrollBtn && (
            <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={scrollToBottom}
                className="h-8 w-8 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-all active:scale-90"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Input */}
          <ChatInputBar
            message={message}
            onMessageChange={setMessage}
            onSend={sendMessage}
            isLoading={isLoading}
            isStreaming={isStreaming}
            isTemporaryChat={isTemporaryChat}
            selectedPersonality={selectedPersonality}
            chatMode={chatMode}
            onToggleMode={() => setChatMode((m) => (m === 'normal' ? 'chat_buddy' : 'normal'))}
            inputRef={inputRef}
          />
        </div>
      </div>
    </AppLayout>
  );
}

export default function AiChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AiChatContent />
    </Suspense>
  );
}
