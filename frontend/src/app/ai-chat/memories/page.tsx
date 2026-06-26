'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { aiChatApiService } from '@/services/ai-chat.service';
import type { ConversationMemoryItem } from '@/types';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  personal:      { label: 'Personal',      color: 'bg-purple-100 text-purple-800 border-purple-200' },
  goals:         { label: 'Goals',         color: 'bg-blue-100 text-blue-800 border-blue-200' },
  health:        { label: 'Health',        color: 'bg-green-100 text-green-800 border-green-200' },
  work:          { label: 'Work',          color: 'bg-orange-100 text-orange-800 border-orange-200' },
  relationships: { label: 'Relationships', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  preferences:   { label: 'Preferences',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  context:       { label: 'Context',       color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const CATEGORY_ORDER = ['personal', 'goals', 'health', 'work', 'relationships', 'preferences', 'context'];

function getCategoryConfig(category: string | null) {
  const key = (category ?? 'context').toLowerCase();
  return CATEGORY_CONFIG[key] ?? { label: category ?? 'Other', color: 'bg-gray-100 text-gray-800 border-gray-200' };
}

export default function MemoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [memories, setMemories] = useState<ConversationMemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    aiChatApiService
      .getMemories()
      .then(setMemories)
      .catch(() => toast({ title: 'Failed to load memories', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await aiChatApiService.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      toast({ title: 'Memory removed' });
    } catch {
      toast({ title: 'Failed to remove memory', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  }

  // Group by category in defined order
  const grouped = CATEGORY_ORDER.reduce<Record<string, ConversationMemoryItem[]>>((acc, cat) => {
    const items = memories.filter(m => (m.category ?? 'context').toLowerCase() === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  // Catch-all for unexpected categories
  memories.forEach(m => {
    const key = (m.category ?? 'context').toLowerCase();
    if (!CATEGORY_ORDER.includes(key)) {
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    }
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/ai-chat">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-500" />
              AI Memories
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Things your Chat Buddy has learned about you
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!loading && memories.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
            <Brain className="h-14 w-14 opacity-30" />
            <p className="text-lg font-medium">No memories yet</p>
            <p className="text-sm max-w-xs">
              Start a Chat Buddy conversation and the AI will automatically build a memory of the
              important things you share.
            </p>
            <Link href="/ai-chat">
              <Button variant="outline" className="mt-2">
                Open Chat Buddy
              </Button>
            </Link>
          </div>
        )}

        {/* Memory groups */}
        {!loading && Object.entries(grouped).map(([cat, items]) => {
          const cfg = getCategoryConfig(cat);
          return (
            <Card key={cat} className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Badge className={`${cfg.color} border text-xs font-semibold`}>
                    {cfg.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-normal">
                    {items.length} {items.length === 1 ? 'memory' : 'memories'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {items.map(memory => (
                  <div
                    key={memory.id}
                    className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm leading-relaxed flex-1">{memory.memoryText}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={deleting === memory.id}
                      onClick={() => handleDelete(memory.id)}
                      aria-label="Remove memory"
                    >
                      {deleting === memory.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* Footer count */}
        {!loading && memories.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            {memories.length} total {memories.length === 1 ? 'memory' : 'memories'}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
