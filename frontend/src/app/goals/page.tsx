'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Target, PlusCircle, Loader2, ChevronDown, ChevronRight, MoreVertical,
  Edit, Trash, Archive, Undo2, CheckCircle2,
  TrendingUp, Briefcase, Heart, GraduationCap, DollarSign, Sparkles,
  Star, Flag, Calendar, Lightbulb, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal, GoalCategory, SubGoal } from '@/types';
import { useGoals } from '@/hooks/api';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES: GoalCategory[] = [
  'Career', 'Health & Fitness', 'Personal Development', 'Education',
  'Finance', 'Relationships', 'Creativity', 'Lifestyle', 'Other',
];

const CATEGORY_META: Record<GoalCategory, { icon: React.ElementType; color: string }> = {
  'Career':              { icon: Briefcase,    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30' },
  'Health & Fitness':    { icon: Heart,         color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30' },
  'Personal Development':{ icon: Lightbulb,    color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' },
  'Education':           { icon: GraduationCap, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30' },
  'Finance':             { icon: DollarSign,   color: 'text-green-500 bg-green-100 dark:bg-green-900/30' },
  'Relationships':       { icon: Star,          color: 'text-pink-500 bg-pink-100 dark:bg-pink-900/30' },
  'Creativity':          { icon: Sparkles,     color: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30' },
  'Lifestyle':           { icon: Award,        color: 'text-teal-500 bg-teal-100 dark:bg-teal-900/30' },
  'Other':               { icon: Flag,         color: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeProgress(goal: Goal): number {
  if (!goal.subGoals.length) return goal.archived ? 100 : 0;
  const completed = goal.subGoals.filter(s => s.completed).length;
  return Math.round((completed / goal.subGoals.length) * 100);
}

// ─── SubGoal Row ──────────────────────────────────────────────────────────────
function SubGoalRow({ sub, onToggle }: { sub: SubGoal; onToggle: () => void }) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox checked={sub.completed} onCheckedChange={onToggle} className="mt-0.5" />
      <span className={cn('text-sm flex-1', sub.completed && 'line-through text-muted-foreground')}>
        {sub.title}
      </span>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({
  goal, onEdit, onDelete, onArchive, onToggleSubGoal,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onToggleSubGoal: (subId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { icon: CategoryIcon, color } = CATEGORY_META[goal.category] ?? CATEGORY_META['Other'];
  const progress = computeProgress(goal);
  const completedSubs = goal.subGoals.filter(s => s.completed).length;
  const iconBg = color.split(' ').slice(1).join(' ');
  const iconColor = color.split(' ')[0];

  return (
    <Card className={cn('group transition-all duration-200 hover:shadow-md', goal.archived && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('shrink-0 rounded-xl p-2 mt-0.5', iconBg)}>
            <CategoryIcon className={cn('h-4 w-4', iconColor)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5">
                  <h3 className={cn('font-semibold text-sm sm:text-base leading-tight', goal.archived && 'line-through')}>
                    {goal.title}
                  </h3>
                  {goal.goalType && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">{goal.goalType}</Badge>
                  )}
                </div>
                <Badge className={cn('mt-1 text-[10px] h-4 px-1.5', color)}>{goal.category}</Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                  <DropdownMenuItem onSelect={onArchive}>
                    {goal.archived
                      ? <><Undo2 className="mr-2 h-4 w-4" />Unarchive</>
                      : <><Archive className="mr-2 h-4 w-4" />Archive</>}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                    <Trash className="mr-2 h-4 w-4" />Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {goal.motive && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">
                <Lightbulb className="inline h-3 w-3 mr-0.5" />"{goal.motive}"
              </p>
            )}

            {goal.subGoals.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completedSubs}/{goal.subGoals.length} sub-goals</span>
                  <span className="font-medium text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            {goal.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{goal.description}</p>
            )}

            {goal.targetDate && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Target: {new Date(goal.targetDate).toLocaleDateString()}
              </div>
            )}

            {goal.subGoals.length > 0 && (
              <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-2 h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
                    {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {expanded ? 'Hide' : 'Show'} sub-goals
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 pl-1">
                  {goal.subGoals.sort((a, b) => a.order - b.order).map(sub => (
                    <SubGoalRow key={sub.id} sub={sub} onToggle={() => onToggleSubGoal(sub.id)} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Goal Form Dialog ─────────────────────────────────────────────────────────
type GoalFormState = {
  title: string;
  category: GoalCategory;
  goalType: 'step-by-step' | 'hierarchy' | 'milestone' | '';
  motive: string;
  description: string;
  targetDate: string;
  subGoalInputs: string[];
};

const defaultForm = (): GoalFormState => ({
  title: '', category: 'Personal Development', goalType: '',
  motive: '', description: '', targetDate: '', subGoalInputs: [''],
});

function goalToForm(goal: Goal): GoalFormState {
  return {
    title: goal.title, category: goal.category, goalType: goal.goalType ?? '',
    motive: goal.motive, description: goal.description,
    targetDate: goal.targetDate?.slice(0, 10) ?? '',
    subGoalInputs: goal.subGoals.length ? goal.subGoals.map(s => s.title) : [''],
  };
}

function GoalFormDialog({
  open, onOpenChange, editGoal, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editGoal: Goal | null;
  onSave: (form: GoalFormState) => Promise<void>;
}) {
  const [form, setForm] = useState<GoalFormState>(defaultForm());
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (v) setForm(editGoal ? goalToForm(editGoal) : defaultForm());
    onOpenChange(v);
  };

  const addSubGoal = () => setForm(f => ({ ...f, subGoalInputs: [...f.subGoalInputs, ''] }));
  const removeSubGoal = (i: number) =>
    setForm(f => ({ ...f, subGoalInputs: f.subGoalInputs.filter((_, j) => j !== i) }));
  const setSubGoal = (i: number, val: string) =>
    setForm(f => ({ ...f, subGoalInputs: f.subGoalInputs.map((s, j) => j === i ? val : s) }));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try { await onSave(form); onOpenChange(false); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
          <DialogDescription>
            {editGoal ? 'Update goal details.' : 'Define a meaningful goal with clear sub-goals.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Goal Title *</Label>
            <Input placeholder="e.g., Run a 5K marathon" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as GoalCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Structure</Label>
              <Select value={form.goalType || 'none'}
                onValueChange={v => setForm(f => ({ ...f, goalType: v === 'none' ? '' : v as GoalFormState['goalType'] }))}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unstructured</SelectItem>
                  <SelectItem value="step-by-step">Step by Step</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="hierarchy">Hierarchy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" />Your Why (Motive)</Label>
            <Input placeholder="Why is this goal important to you?" value={form.motive}
              onChange={e => setForm(f => ({ ...f, motive: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea placeholder="Describe your goal in detail…" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Target Date</Label>
            <Input type="date" value={form.targetDate}
              onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Sub-goals</Label>
            <div className="space-y-1.5">
              {form.subGoalInputs.map((sg, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder={`Sub-goal ${i + 1}`} value={sg}
                    onChange={e => setSubGoal(i, e.target.value)} />
                  {form.subGoalInputs.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                      onClick={() => removeSubGoal(i)}>
                      <Trash className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={addSubGoal}>
              <PlusCircle className="h-3.5 w-3.5" />Add sub-goal
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editGoal ? 'Update' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const { goals, isLoading, addGoal, updateGoal, deleteGoal } = useGoals();
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | 'All'>('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const filtered = goals.filter(g => {
    if (filter === 'active' && g.archived) return false;
    if (filter === 'archived' && !g.archived) return false;
    if (categoryFilter !== 'All' && g.category !== categoryFilter) return false;
    return true;
  });

  const activeCount = goals.filter(g => !g.archived).length;
  const archivedCount = goals.filter(g => g.archived).length;

  const openAdd = () => { setEditGoal(null); setDialogOpen(true); };
  const openEdit = (goal: Goal) => { setEditGoal(goal); setDialogOpen(true); };

  const handleSave = async (form: GoalFormState) => {
    const subGoalsList = form.subGoalInputs
      .filter(s => s.trim())
      .map((title, i) => ({ id: `sg-${Date.now()}-${i}`, title, completed: false, order: i }));

    if (editGoal) {
      await updateGoal({
        id: editGoal.id,
        updates: {
          title: form.title.trim(), category: form.category,
          goalType: form.goalType || undefined, motive: form.motive,
          description: form.description,
          targetDate: form.targetDate || undefined,
          subGoals: subGoalsList,
        },
      });
    } else {
      await addGoal({
        title: form.title.trim(), category: form.category,
        goalType: form.goalType || undefined, motive: form.motive,
        description: form.description,
        targetDate: form.targetDate || undefined,
        subGoals: subGoalsList, progressTrackers: [], notes: [], resources: [],
        linkedHabitIds: [], archived: false,
      });
    }
  };

  const handleToggleSubGoal = async (goal: Goal, subId: string) => {
    const updated = goal.subGoals.map(s =>
      s.id === subId
        ? { ...s, completed: !s.completed, completedAt: !s.completed ? new Date().toISOString() : undefined }
        : s
    );
    await updateGoal({ id: goal.id, updates: { subGoals: updated } });
  };

  return (
    <AppLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-64 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading goals…</span>
        </div>
      ) : (
      <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />Goals
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeCount} active &middot; {archivedCount} archived
            </p>
          </div>
          <Button onClick={openAdd} className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" />New Goal
          </Button>
        </div>

        {/* Stats */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',    value: goals.length,  icon: Target,     color: 'text-primary' },
              { label: 'Active',   value: activeCount,   icon: TrendingUp, color: 'text-green-500' },
              { label: 'Archived', value: archivedCount, icon: Archive,    color: 'text-muted-foreground' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="p-3 flex items-center gap-2.5">
                <Icon className={cn('h-5 w-5 shrink-0', color)} />
                <div>
                  <p className="text-lg font-bold leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex rounded-lg border p-0.5 bg-muted/30 w-fit">
            {(['active', 'archived'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize',
                  filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setCategoryFilter('All')}
              className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                categoryFilter === 'All'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:border-primary')}>
              All
            </button>
            {CATEGORIES.map(cat => {
              const { icon: Icon } = CATEGORY_META[cat];
              return (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1',
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary')}>
                  <Icon className="h-3 w-3" />{cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Goals list */}
        {filtered.length === 0 ? (
          <Card className="p-10">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-5">
                  <Target className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {filter === 'active' ? 'No active goals' : 'No archived goals'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {filter === 'active'
                    ? 'Create your first goal to start tracking your progress.'
                    : 'Archived goals will appear here.'}
                </p>
              </div>
              {filter === 'active' && (
                <Button onClick={openAdd}><PlusCircle className="mr-2 h-4 w-4" />Create Goal</Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(goal => (
              <GoalCard
                key={goal.id} goal={goal}
                onEdit={() => openEdit(goal)}
                onDelete={() => deleteGoal(goal.id)}
                onArchive={async () => updateGoal({ id: goal.id, updates: { archived: !goal.archived } })}
                onToggleSubGoal={(subId) => handleToggleSubGoal(goal, subId)}
              />
            ))}
          </div>
        )}
      </div>

      <GoalFormDialog
        open={dialogOpen} onOpenChange={setDialogOpen}
        editGoal={editGoal} onSave={handleSave}
      />
      </>
      )}
    </AppLayout>
  );
}
