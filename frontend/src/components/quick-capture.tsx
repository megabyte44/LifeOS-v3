'use client';

import React, { useEffect, useState } from 'react';
import { Plus, CheckSquare, StickyNote, Wallet, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTodos, useNotes, useTransactions } from '@/hooks/api';
import { useToast } from '@/hooks/use-toast';

type CaptureMode = 'todo' | 'note' | 'expense';

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CaptureMode>('todo');
  const [value, setValue] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addTodo } = useTodos();
  const { addNote } = useNotes();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  // Global shortcut: Ctrl/Cmd + N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !e.shiftKey) {
        // Don't capture if user is typing in an input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const reset = () => {
    setValue('');
    setAmount('');
    setCategory('Other');
  };

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setIsSubmitting(true);

    try {
      if (mode === 'todo') {
        await addTodo({ text: value.trim(), completed: false, priority: 'medium' });
        toast({ title: 'Todo added' });
      } else if (mode === 'note') {
        await addNote({ title: value.trim(), content: '', type: 'text' });
        toast({ title: 'Note created' });
      } else if (mode === 'expense') {
        const cents = Math.round(parseFloat(amount) * 100);
        if (isNaN(cents) || cents <= 0) {
          toast({ title: 'Enter a valid amount', variant: 'destructive' });
          setIsSubmitting(false);
          return;
        }
        await addTransaction({
          description: value.trim(),
          amount: cents,
          type: 'expense',
          category,
          date: new Date().toISOString().split('T')[0],
        });
        toast({ title: 'Expense logged' });
      }
      reset();
      setOpen(false);
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const modes: { id: CaptureMode; label: string; icon: React.ElementType }[] = [
    { id: 'todo', label: 'Todo', icon: CheckSquare },
    { id: 'note', label: 'Note', icon: StickyNote },
    { id: 'expense', label: 'Expense', icon: Wallet },
  ];

  return (
    <>
      {/* Floating action button - mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed right-4 bottom-20 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="sm:max-w-md gap-0 p-0 rounded-xl overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3">
            <DialogTitle className="text-base font-medium">Quick Capture</DialogTitle>
          </DialogHeader>

          {/* Mode tabs */}
          <div className="flex gap-1 px-4 pb-3">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  mode === m.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Input area */}
          <div className="px-4 pb-4 space-y-3">
            <Input
              autoFocus
              placeholder={
                mode === 'todo' ? 'What needs to be done?' :
                mode === 'note' ? 'Note title...' :
                'What did you spend on?'
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && mode !== 'expense') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="h-10"
            />

            {mode === 'expense' && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="h-10 flex-1"
                />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Transportation">Transport</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Bills">Bills</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Ctrl</kbd>
                {' + '}
                <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">N</kbd>
                {' to toggle'}
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!value.trim() || isSubmitting}
                className="h-8"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
