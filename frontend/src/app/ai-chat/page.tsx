'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// AI Personality Types - Based on SmartLifeOS System Instructions
const AI_PERSONALITIES = {
  casual: {
    name: 'Casual Buddy',
    icon: MessageSquare,
    description: 'Friendly, conversational, and relaxed 😊',
    systemInstructions: 'Mode: Casual. Be warm, supportive, and conversational like a friend who knows their life. Use contractions, light humor, and give gentle nudges. Celebrate wins and keep things encouraging.',
    color: 'orange',
    gradient: 'from-orange-500 to-pink-500'
  },
  personal: {
    name: 'Personal Mentor',
    icon: MessageCircle,
    description: 'Empathetic, thoughtful, and insightful 💭',
    systemInstructions: 'Mode: Personal. Be like a trusted mentor or life coach. Ask meaningful questions, connect actions to goals, acknowledge struggles, and provide thoughtful perspective from their data. Focus on growth and reflection.',
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-500'
  },
  professional: {
    name: 'Professional Assistant',
    icon: Zap,
    description: 'Strategic, efficient, and action-oriented 💼',
    systemInstructions: 'Mode: Professional. Be a competent executive assistant and productivity consultant. Provide clear analysis, structured recommendations, data-driven insights, and actionable plans. Focus on optimization and effectiveness.',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500'
  }
};

const PERSONALITY_COLORS: Record<string, string> = {
  casual: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
  personal: 'border-purple-500 bg-purple-50 dark:bg-purple-950/20',
  professional: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
};

const PERSONALITY_DOT_BG: Record<string, string> = {
  casual: 'bg-orange-500',
  personal: 'bg-purple-500',
  professional: 'bg-blue-500',
};

const SUGGESTED_PROMPTS = [
  { text: 'Help me plan my day', icon: '📅' },
  { text: 'Review my habit progress', icon: '🔥' },
  { text: 'Give me budget advice', icon: '💰' },
  { text: 'Motivate me to stay on track', icon: '🚀' },
];

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

function AiChatContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<keyof typeof AI_PERSONALITIES>('casual');
  const [customInstructions] = useState('');
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [aiSettings, setAiSettings] = useState({
    defaultPersonality: 'casual' as keyof typeof AI_PERSONALITIES,
    preferredModel: 'gemini',
    enableContextMemory: true,
    maxContextLength: 10
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // LocalStorage keys
  const STORAGE_KEY = `ai_chat_sessions_${user?.uid || 'guest'}`;
  const CURRENT_SESSION_KEY = `ai_chat_current_${user?.uid || 'guest'}`;

  // Save sessions to localStorage
  const saveSessions = (sessionsToSave: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error('Error saving sessions to localStorage:', error);
    }
  };

  // Load sessions from localStorage
  const loadSessions = (): ChatSession[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading sessions from localStorage:', error);
    }
    return [];
  };

  // Save current session ID
  const saveCurrentSessionId = (sessionId: string | null) => {
    try {
      if (sessionId) {
        localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
      } else {
        localStorage.removeItem(CURRENT_SESSION_KEY);
      }
    } catch (error) {
      console.error('Error saving current session ID:', error);
    }
  };

  // Load current session ID
  const loadCurrentSessionId = (): string | null => {
    try {
      return localStorage.getItem(CURRENT_SESSION_KEY);
    } catch (error) {
      console.error('Error loading current session ID:', error);
      return null;
    }
  };

  // Load sessions on mount
  useEffect(() => {
    if (user) {
      const loadedSessions = loadSessions();
      if (loadedSessions.length > 0) {
        setSessions(loadedSessions);
        const savedSessionId = loadCurrentSessionId();
        if (savedSessionId && loadedSessions.find(s => s.id === savedSessionId)) {
          setCurrentSessionId(savedSessionId);
        }
      }
    }
  }, [user]);

  // Save sessions whenever they change
  useEffect(() => {
    if (user && sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions, user]);

  // Save current session ID whenever it changes
  useEffect(() => {
    if (user) {
      saveCurrentSessionId(currentSessionId);
    }
  }, [currentSessionId, user]);
  
  const currentSession = sessions.find(s => s.id === currentSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  useEffect(() => {
    if (currentSession?.personality) {
      setSelectedPersonality(currentSession.personality);
    }
  }, [currentSession?.personality]);

  // Load AI settings
  useEffect(() => {
    if (!user) return;
    
    // Mock settings
    const mockSettings = {
        defaultPersonality: 'casual' as keyof typeof AI_PERSONALITIES,
        preferredModel: 'gemini',
        enableContextMemory: true,
        maxContextLength: 10
    };
    
    setAiSettings(mockSettings);
    // Set default personality if no session is active
    if (!currentSession) {
      setSelectedPersonality(mockSettings.defaultPersonality || 'casual');
    }

  }, [user, currentSession]);

  // Handle personality parameter from URL
  useEffect(() => {
    const personalityParam = searchParams?.get('personality');
    if (personalityParam && personalityParam in AI_PERSONALITIES) {
      setSelectedPersonality(personalityParam as keyof typeof AI_PERSONALITIES);
      // Auto-create session with selected personality
      setTimeout(() => {
        createNewSession();
      }, 100);
    }
  }, [searchParams]);

  const createNewSession = () => {
    const personality = selectedPersonality || aiSettings.defaultPersonality;
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Chat with ${AI_PERSONALITIES[personality].name}`,
      messages: [],
      personality: personality,
      customInstructions,
      createdAt: new Date()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsTemporaryChat(false);
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'You need to be logged in to chat with the AI.',
        variant: 'destructive',
      });
      return;
    }
    
    let session = currentSession;
    if (!session && !isTemporaryChat) {
      const newSession = {
        id: `session-${Date.now()}`,
        title: `Chat with ${AI_PERSONALITIES[selectedPersonality].name}`,
        messages: [],
        personality: selectedPersonality,
        customInstructions,
        createdAt: new Date()
      };
      
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      session = newSession;
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    // Add user message to session or temporary chat
    if (isTemporaryChat) {
      // For temporary chat, just use a temporary session structure
      if (!currentSession) {
        const tempSession = {
          id: 'temp',
          title: 'Temporary Chat',
          messages: [userMessage],
          personality: selectedPersonality,
          customInstructions,
          createdAt: new Date()
        };
        setSessions(prev => [tempSession]);
        setCurrentSessionId('temp');
        session = tempSession;
      } else {
        setSessions(prev => prev.map(s => 
          s.id === 'temp' ? { ...s, messages: [...s.messages, userMessage] } : s
        ));
      }
    } else {
      // Add user message to regular session
      const updatedSession = {
        ...session!,
        messages: [...session!.messages, userMessage]
      };
      setSessions(prev => prev.map(s => s.id === session!.id ? updatedSession : s));
    }

    setMessage('');
    setIsLoading(true);

    try {
      const systemInstructions = AI_PERSONALITIES[selectedPersonality].systemInstructions + 
        (customInstructions ? `\n\nAdditional instructions: ${customInstructions}` : '');

      const contextMessages = aiSettings.enableContextMemory 
        ? (session?.messages || []).slice(-aiSettings.maxContextLength)
        : [];

      const token = await user.getIdToken();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemInstructions },
            ...contextMessages,
            userMessage
          ],
          model: aiSettings.preferredModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.text || data.response || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date()
      };

      if (isTemporaryChat) {
        setSessions(prev => prev.map(s => 
          s.id === 'temp' 
            ? { ...s, messages: [...s.messages, aiMessage] }
            : s
        ));
      } else {
        setSessions(prev => prev.map(s => 
          s.id === session!.id 
            ? { ...s, messages: [...s.messages, aiMessage] }
            : s
        ));
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `⚠️ **Error**: ${error.message || 'Failed to get AI response'}\n\nPlease check your internet connection and try again. If you're using Gemini API, make sure your API key is properly configured in the environment variables.`,
        timestamp: new Date()
      };

      if (isTemporaryChat) {
        setSessions(prev => prev.map(s => 
          s.id === 'temp' 
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        ));
      } else {
        setSessions(prev => prev.map(s => 
          s.id === session!.id 
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        ));
      }

      toast({
        title: 'Chat Error',
        description: 'Failed to get AI response. Error message added to chat.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
    toast({
      title: 'Chat Deleted',
      description: 'Chat session has been removed.',
    });
  };

  const clearAllSessions = () => {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      setSessions([]);
      setCurrentSessionId(null);
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CURRENT_SESSION_KEY);
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
      toast({
        title: 'All Chats Cleared',
        description: 'Chat history has been completely cleared.',
      });
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard.',
    });
  };

  // Session renaming functions
  const startRenameSession = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const saveSessionTitle = (sessionId: string) => {
    if (editingTitle.trim()) {
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, title: editingTitle.trim() }
          : s
      ));
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const cancelRenameSession = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  // Auto-focus input when chat opens or after responses
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentSessionId, isLoading, currentSession?.messages?.length]);

  // Toggle temporary chat session
  const toggleTemporaryChat = () => {
    if (isTemporaryChat) {
      // Exit temporary chat mode - go back to normal chat
      setIsTemporaryChat(false);
      setCurrentSessionId(null);
      // Clean up any existing temp session
      setSessions(prev => prev.filter(s => s.id !== 'temp'));
    } else {
      // Enter temporary chat mode
      setIsTemporaryChat(true);
      setCurrentSessionId(null);
      // Clean up any existing temp session
      setSessions(prev => prev.filter(s => s.id !== 'temp'));
    }
    setIsMobileSidebarOpen(false);
  };

  const personality = AI_PERSONALITIES[selectedPersonality];
  const PersonalityIcon = personality.icon;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden relative">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-2 py-1 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="flex items-center gap-1 h-7 px-1 text-xs"
          >
            <Menu className="h-3 w-3" />
            <span className="font-medium truncate max-w-32">
              {isTemporaryChat ? 'Temporary Chat' : (currentSession?.title || 'AI Chat')}
            </span>
          </Button>
          
          {/* Prominent Temporary Chat Button */}
          <Button
            onClick={toggleTemporaryChat}
            variant={isTemporaryChat ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1 h-7 px-2 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            {isTemporaryChat ? "Exit Temp" : "Temp"}
          </Button>
        </div>

        {/* Sidebar - Desktop Always Visible, Mobile Overlay */}
        <div className={cn(
          "flex flex-col bg-background border-r",
          "fixed top-14 left-0 z-40 w-80 h-[calc(100vh-3.5rem)] transform transition-transform duration-200 ease-in-out",
          "md:relative md:translate-x-0 md:w-80 md:h-full md:z-auto md:top-0",
          isMobileSidebarOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none md:pointer-events-auto md:translate-x-0"
        )}>
          {/* Mobile Sidebar Header */}
          <div className="md:hidden flex items-center justify-between px-2 py-1 border-b">
            <h2 className="font-semibold text-xs">AI Chat Sessions</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex flex-col h-full p-2.5 space-y-3">
            {/* New Chat Button */}
            <Button onClick={createNewSession} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Chat
            </Button>

            {/* Temporary Chat Toggle */}
            <Button
              onClick={toggleTemporaryChat}
              variant={isTemporaryChat ? "default" : "outline"}
              size="sm"
              className={cn("w-full", isTemporaryChat && "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0")}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {isTemporaryChat ? "Exit Temporary" : "Temporary Chat"}
            </Button>

            {sessions.filter(s => s.id !== 'temp').length > 0 && (
              <Button 
                onClick={clearAllSessions} 
                variant="ghost" 
                className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10" 
                size="sm"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}

            {/* Chat Sessions List */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-medium text-muted-foreground">Recent Chats</h3>
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                  {sessions.filter(s => s.id !== 'temp').length}
                </Badge>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="space-y-1">
                  {sessions.filter(s => s.id !== 'temp').length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <MessageCircle className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">No chat sessions yet</p>
                      <p className="text-xs">Start a new conversation!</p>
                    </div>
                  ) : (
                    sessions.filter(s => s.id !== 'temp').map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "group relative rounded-md border p-2 cursor-pointer transition-all hover:bg-accent",
                          currentSessionId === session.id && "bg-accent border-primary"
                        )}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          setIsTemporaryChat(false);
                          setSelectedPersonality(session.personality);
                          setIsMobileSidebarOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            PERSONALITY_DOT_BG[session.personality]
                          )} />
                          
                          {editingSessionId === session.id ? (
                            <div className="flex-1 flex items-center gap-1">
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="h-6 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveSessionTitle(session.id);
                                  if (e.key === 'Escape') cancelRenameSession();
                                }}
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveSessionTitle(session.id);
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelRenameSession();
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-sm font-medium truncate">
                                {session.title}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRenameSession(session.id, session.title);
                                  }}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSession(session.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{session.messages.length} messages</span>
                          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="md:hidden fixed top-14 left-0 right-0 bottom-16 z-30 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative min-h-0">
          {/* Chat Header - Desktop Only */}
          <div className="hidden md:flex items-center justify-between px-4 py-2.5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shadow-sm",
                `bg-gradient-to-br ${personality.gradient}`
              )}>
                <PersonalityIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">
                  {isTemporaryChat ? "Temporary Chat" : (currentSession?.title || personality.name)}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isTemporaryChat 
                    ? "This chat won't be saved" 
                    : `${currentSession?.messages.length || 0} messages · ${personality.name}`
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isTemporaryChat && (
                <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Ephemeral
                </Badge>
              )}
              <Button
                onClick={() => window.open('/settings?tab=ai', '_blank')}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col min-h-0 pb-20 md:pb-0 overflow-hidden">
            <ScrollArea className="flex-1 px-2 py-2 md:px-3 md:py-3 h-full">
              <div className="max-w-4xl mx-auto space-y-3 pb-4">
                {/* Welcome Message */}
                {(!currentSession || currentSession.messages.length === 0) && !isTemporaryChat && (
                  <div className="py-8 md:py-12 space-y-8">
                    {/* Hero */}
                    <div className="text-center space-y-4">
                      <div className="relative inline-block">
                        <div className={cn(
                          "w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg",
                          `bg-gradient-to-br ${personality.gradient}`
                        )}>
                          <PersonalityIcon className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 -z-10 blur-sm" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">
                          Chat with {personality.name}
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                          {personality.description}
                        </p>
                      </div>
                    </div>

                    {/* Personality Selector */}
                    <div>
                      <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider text-center">Choose Personality</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                        {Object.entries(AI_PERSONALITIES).map(([key, p]) => {
                          const Icon = p.icon;
                          const isSelected = selectedPersonality === key;
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedPersonality(key as keyof typeof AI_PERSONALITIES)}
                              className={cn(
                                "relative p-4 rounded-xl border-2 transition-all text-left hover:shadow-md",
                                isSelected
                                  ? PERSONALITY_COLORS[key]
                                  : "border-border hover:border-muted-foreground/30"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                                  `bg-gradient-to-br ${p.gradient}`
                                )}>
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm">{p.name}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.description}</div>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", `bg-gradient-to-br ${p.gradient}`)}>
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Suggested Prompts */}
                    <div>
                      <h4 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wider text-center">Try asking</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                        {SUGGESTED_PROMPTS.map((prompt) => (
                          <button
                            key={prompt.text}
                            onClick={() => {
                              setMessage(prompt.text);
                              inputRef.current?.focus();
                            }}
                            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 hover:shadow-sm transition-all text-left text-sm group"
                          >
                            <span className="text-lg shrink-0">{prompt.icon}</span>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{prompt.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Temporary Chat Welcome */}
                {isTemporaryChat && (!currentSession || currentSession.messages.length === 0) && (
                  <div className="py-8 md:py-12 space-y-6">
                    <div className="text-center space-y-4">
                      <div className="relative inline-block">
                        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                          <Sparkles className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 -z-10 blur-sm" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Temporary Chat</h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                          This conversation won&apos;t be saved. Perfect for sensitive or one-time questions.
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ephemeral Mode
                      </Badge>
                    </div>

                    {/* Suggested Prompts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt.text}
                          onClick={() => {
                            setMessage(prompt.text);
                            inputRef.current?.focus();
                          }}
                          className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 hover:shadow-sm transition-all text-left text-sm group"
                        >
                          <span className="text-lg shrink-0">{prompt.icon}</span>
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors">{prompt.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                {currentSession?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col group",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    {/* Profile Icon + Name + Time */}
                    <div className={cn(
                      "flex items-center gap-2 mb-1.5",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}>
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                        msg.role === 'user' 
                          ? "bg-primary" 
                          : `bg-gradient-to-br ${personality.gradient}`
                      )}>
                        {msg.role === 'user' ? (
                          <User className="h-3.5 w-3.5 text-primary-foreground" />
                        ) : (
                          <PersonalityIcon className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {msg.role === 'user' ? 'You' : personality.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Message Content */}
                    <div className={cn(
                      "max-w-[92%] md:max-w-[80%] rounded-2xl px-4 py-3 relative shadow-sm",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/80 border border-border/40"
                    )}>
                      {msg.role === 'assistant' ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      )}
                      
                      {/* Message Actions */}
                      <div className={cn(
                        "absolute -bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200",
                        msg.role === 'user' ? "right-2" : "left-2"
                      )}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[10px] bg-background shadow-sm rounded-full"
                          onClick={() => copyMessage(msg.content)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading Message */}
                {isLoading && (
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shadow-sm",
                        `bg-gradient-to-br ${personality.gradient}`
                      )}>
                        <PersonalityIcon className="h-3.5 w-3.5 text-white animate-pulse" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{personality.name}</span>
                    </div>
                    
                    <div className="bg-muted/80 border border-border/40 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm font-medium">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Fixed Input Bar at Bottom */}
          <div className="fixed bottom-16 left-0 right-0 md:absolute md:bottom-0 md:left-0 md:right-0 border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-[0_-2px_20px_rgba(0,0,0,0.06)] z-20">
            <div className="px-3 py-3 md:px-4 md:py-3 max-w-4xl md:mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Message ${personality.name}...`}
                    className="min-h-[48px] max-h-36 resize-none pr-14 text-sm rounded-2xl border-2 border-border/60 focus:border-primary/60 bg-muted/30 focus:bg-background transition-all shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim() || isLoading}
                    size="sm"
                    className={cn(
                      "absolute right-2 bottom-2 h-9 w-9 p-0 rounded-xl transition-all shadow-sm",
                      message.trim() 
                        ? `bg-gradient-to-br ${personality.gradient} hover:shadow-md` 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Input Help Text */}
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[11px] text-muted-foreground/70">
                  {isTemporaryChat ? "🔒 Temporary — not saved" : "↵ Enter to send · Shift+Enter for new line"}
                </span>
                {isTemporaryChat && (
                  <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 text-[10px] px-1.5 py-0 h-4">
                    Temp
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function AiChatPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <AiChatContent />
    </Suspense>
  );
}