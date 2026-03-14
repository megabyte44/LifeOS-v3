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
import type { ChatMessage, ChatSession } from '@/components/chat';

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
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [aiSettings] = useState({
    defaultPersonality: 'casual' as keyof typeof AI_PERSONALITIES,
    preferredModel: '',
    enableContextMemory: true,
    maxContextLength: 10,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const CLOUD_SESSION_ID = 'cloud-history';

  // ── Load server history ──
  const loadServerHistory = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setCurrentSessionId(null);
      return;
    }
    try {
      const history = await aiChatService.getHistory(200);
      if (!history.length) {
        setSessions((prev) => prev.filter((s) => s.id === 'temp'));
        if (!isTemporaryChat) setCurrentSessionId(null);
        return;
      }
      const chronological = [...history].reverse();
      const allMessages: ChatMessage[] = chronological.flatMap((item) => {
        const ts = new Date(item.createdAt);
        return [
          { id: `${item.id}-u`, role: 'user' as const, content: item.userMessage, timestamp: ts },
          { id: `${item.id}-a`, role: 'assistant' as const, content: item.assistantMessage, timestamp: ts },
        ];
      });
      const latestItem = chronological[chronological.length - 1];
      const cloudSession: ChatSession = {
        id: CLOUD_SESSION_ID,
        title: 'Cloud Chat History',
        messages: allMessages,
        personality: normalizePersonality(latestItem?.personality),
        createdAt: new Date(chronological[0].createdAt),
      };
      setSessions((prev) => {
        const temp = prev.find((s) => s.id === 'temp');
        return temp ? [temp, cloudSession] : [cloudSession];
      });
      if (!isTemporaryChat) setCurrentSessionId(CLOUD_SESSION_ID);
    } catch (error: any) {
      console.error('Failed to load cloud chat history:', error);
      toast({ title: 'History Sync Failed', description: error?.message || 'Could not load cloud chat history.', variant: 'destructive' });
    }
  }, [user, isTemporaryChat, toast]);

  useEffect(() => { void loadServerHistory(); }, [loadServerHistory]);

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

  // ── Session actions ──
  const createNewSession = () => {
    const p = selectedPersonality;
    const s: ChatSession = { id: `session-${Date.now()}`, title: `Chat with ${AI_PERSONALITIES[p].name}`, messages: [], personality: p, createdAt: new Date() };
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

  const clearAllSessions = async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    try {
      await aiChatService.clearHistory();
      setSessions((prev) => prev.filter((s) => s.id === 'temp'));
      setCurrentSessionId(isTemporaryChat ? 'temp' : null);
      toast({ title: 'Cloud Chat History Cleared' });
    } catch (error: any) {
      toast({ title: 'Clear Failed', description: error?.message || 'Could not clear cloud chat history.', variant: 'destructive' });
    }
  };

  const copyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
    toast({ title: 'Copied!' });
  };

  const renameSession = (id: string, newTitle: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  };

  const toggleTemporaryChat = () => {
    setIsTemporaryChat((p) => !p);
    setCurrentSessionId(null);
    setSessions((prev) => prev.filter((s) => s.id !== 'temp'));
    setIsMobileSidebarOpen(false);
  };

  const scrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  // ── Send message ──
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    if (!user) { toast({ title: 'Not Authenticated', description: 'You need to be logged in to chat.', variant: 'destructive' }); return; }

    let session = currentSession;
    if (!session && !isTemporaryChat) {
      const ns: ChatSession = { id: `session-${Date.now()}`, title: `Chat with ${AI_PERSONALITIES[selectedPersonality].name}`, messages: [], personality: selectedPersonality, createdAt: new Date() };
      setSessions((prev) => [ns, ...prev]);
      setCurrentSessionId(ns.id);
      session = ns;
    }

    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: message.trim(), timestamp: new Date() };
    const effectiveId = isTemporaryChat ? 'temp' : session!.id;

    if (isTemporaryChat) {
      if (!currentSession) {
        const tempSession: ChatSession = { id: 'temp', title: 'Temporary Chat', messages: [userMsg], personality: selectedPersonality, createdAt: new Date() };
        setSessions(() => [tempSession]);
        setCurrentSessionId('temp');
        session = tempSession;
      } else {
        setSessions((prev) => prev.map((s) => s.id === 'temp' ? { ...s, messages: [...s.messages, userMsg] } : s));
      }
    } else {
      setSessions((prev) => prev.map((s) => s.id === session!.id ? { ...s, messages: [...s.messages, userMsg] } : s));
    }

    setMessage('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);

    const aiMsgId = `msg-${Date.now()}-ai`;
    const aiPlaceholder: ChatMessage = { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date() };
    setSessions((prev) => prev.map((s) => s.id === effectiveId ? { ...s, messages: [...s.messages, aiPlaceholder] } : s));

    try {
      const systemInstructions = AI_PERSONALITIES[selectedPersonality].systemInstructions;
      const contextMessages = aiSettings.enableContextMemory ? (session?.messages || []).slice(-aiSettings.maxContextLength) : [];
      const normalizedMessages = [
        { role: 'system', content: systemInstructions },
        ...contextMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: userMsg.role, content: userMsg.content },
      ];

      const token = await user.getIdToken();
      const body = {
        messages: normalizedMessages,
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
            try { const parsed = JSON.parse(rawData); if (typeof parsed === 'string') data = parsed; } catch {}
            if (data === '[DONE]') { isDone = true; break; }
            if (data) {
              fullContent += data.replace(/\\n/g, '\n');
              setSessions((prev) => prev.map((s) => s.id === effectiveId ? { ...s, messages: s.messages.map((m) => m.id === aiMsgId ? { ...m, content: fullContent } : m) } : s));
            }
          }
        }
      }
      reader.cancel();
      if (!fullContent) throw new Error('No content received from AI');
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorContent = `**Error**: ${error.message || 'Failed to get AI response'}\n\nPlease try again.`;
      setSessions((prev) => prev.map((s) => s.id === effectiveId ? { ...s, messages: s.messages.map((m) => m.id === aiMsgId ? { ...m, content: errorContent } : m) } : s));
      toast({ title: 'Chat Error', description: error.message || 'Failed to get AI response.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // ── Derived ──
  const personality = AI_PERSONALITIES[selectedPersonality];
  const PersonalityIcon = personality.icon;
  const hasMessages = (currentSession?.messages?.length ?? 0) > 0;

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
          sessions={sessions}
          currentSessionId={currentSessionId}
          isTemporaryChat={isTemporaryChat}
          isMobileOpen={isMobileSidebarOpen}
          sidebarSearch={sidebarSearch}
          onSearchChange={setSidebarSearch}
          onNewChat={createNewSession}
          onToggleTemp={toggleTemporaryChat}
          onSelectSession={(id) => {
            setCurrentSessionId(id);
            setIsTemporaryChat(false);
            const sess = sessions.find(s => s.id === id);
            if (sess) setSelectedPersonality(sess.personality);
          }}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          onClearAll={clearAllSessions}
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
                {isTemporaryChat ? 'Temporary Chat' : currentSession?.title || personality.name}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 chat-scrollbar"
          >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
              {!hasMessages && (
                <WelcomeScreen
                  isTemporaryChat={isTemporaryChat}
                  selectedPersonality={selectedPersonality}
                  chatMode={chatMode}
                  onSelectPersonality={setSelectedPersonality}
                  onSelectMode={setChatMode}
                  onSelectPrompt={(text) => { setMessage(text); inputRef.current?.focus(); }}
                />
              )}

              <div className="space-y-5">
                {currentSession?.messages.map((msg, idx) => (
                  <ChatMessageBubble
                    key={msg.id}
                    msg={msg}
                    personality={selectedPersonality}
                    isLastAi={msg.role === 'assistant' && idx === currentSession.messages.length - 1}
                    isStreaming={isStreaming}
                    isLoading={isLoading}
                    copiedMsgId={copiedMsgId}
                    onCopy={copyMessage}
                  />
                ))}
              </div>

              {/* Standalone thinking indicator */}
              {isLoading && !isStreaming && !currentSession?.messages?.some(m => m.role === 'assistant' && m.content === '') && (
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
