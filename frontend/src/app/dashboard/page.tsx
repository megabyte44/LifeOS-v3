
'use client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, GlassWater, Clock, Droplets, CheckCircle2, ArrowRight, Flame, Check, Plus, CalendarCheck, Trash2, AlertCircle } from 'lucide-react';
import { useHabits, useTodos, usePlanner } from '@/hooks/api';
import type { Habit } from '@/types';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { calculateStreak } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

// ─── Reusable loading skeleton for cards ─────────────────────────────────────
function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4 rounded', i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full')} />
      ))}
    </div>
  );
}

// ─── Reusable error banner inside cards ──────────────────────────────────────
function CardError({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message || 'Failed to load. Check your connection.'}</span>
    </div>
  );
}

// ─── Inline todo adder ──────────────────────────────────────────────────────
function InlineTodoAdd({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Add a task..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="h-9 text-sm"
      />
      <Button size="sm" variant="ghost" onClick={handleSubmit} disabled={!text.trim()} className="h-9 px-3 shrink-0">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Todo List Card ──────────────────────────────────────────────────────────
function TodoListCard() {
  const { todos, addTodo, updateTodo, deleteTodo, isLoading, error, isAdding } = useTodos();

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);
  const completedCount = completedTodos.length;
  const totalCount = todos.length;

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) await updateTodo({ id, updates: { completed: !todo.completed } });
  };

  const handleAddTodo = async (text: string) => {
    await addTodo({ text, completed: false, priority: 'medium' });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
            <ListChecks className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold">Today&apos;s Tasks</CardTitle>
            <CardDescription className="text-xs">
              {isLoading ? 'Loading...' : totalCount > 0 ? `${completedCount}/${totalCount} completed` : 'No tasks yet'}
            </CardDescription>
          </div>
          {totalCount > 0 && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold tracking-tight">{pct}%</p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-1">
        {isLoading ? (
          <CardSkeleton lines={4} />
        ) : error ? (
          <CardError />
        ) : (
          <>
            {activeTodos.map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => toggleTodo(todo.id)}
                  className="shrink-0"
                />
                <span className="text-sm flex-1 min-w-0 truncate">{todo.text}</span>
                <div className={cn('h-2 w-2 rounded-full shrink-0', getPriorityColor(todo.priority))} />
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {completedTodos.slice(0, 3).map((todo) => (
              <div key={todo.id} className="flex items-center gap-3 p-2 rounded-lg opacity-50">
                <Checkbox checked={true} onCheckedChange={() => toggleTodo(todo.id)} className="shrink-0" />
                <span className="text-sm line-through flex-1 min-w-0 truncate">{todo.text}</span>
              </div>
            ))}
            {completedTodos.length > 3 && (
              <p className="text-xs text-muted-foreground pl-9">+{completedTodos.length - 3} more completed</p>
            )}

            <div className="pt-3 border-t mt-2">
              <InlineTodoAdd onAdd={handleAddTodo} />
              {isAdding && <p className="text-[10px] text-muted-foreground mt-1 pl-1">Adding...</p>}
            </div>

            {activeTodos.length === 0 && completedTodos.length === 0 && (
              <div className="text-center py-6 space-y-2">
                <div className="flex justify-center">
                  <div className="rounded-full bg-muted p-3">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">No tasks for today</p>
                <p className="text-xs text-muted-foreground">Add your first task above</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Today's Plan Card ───────────────────────────────────────────────────────
function TodaysPlanCard() {
  const { weeklySchedule, isLoading, error } = usePlanner();
  const now = new Date();
  const dayName = format(now, 'EEEE');
  const todayItems = weeklySchedule[dayName] || [];

  const currentHHMM = format(now, 'HH:mm');
  const nextIdx = todayItems.findIndex((item) => item.startTime > currentHHMM);
  const currentIdx = nextIdx === -1 ? todayItems.length - 1 : Math.max(0, nextIdx - 1);

  const start = Math.max(0, currentIdx - 1);
  const visible = todayItems.slice(start, start + 3);

  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold">Today&apos;s Plan</CardTitle>
            <CardDescription className="text-xs">
              {isLoading ? 'Loading...' : `${todayItems.length} ${todayItems.length === 1 ? 'task' : 'tasks'} scheduled`}
            </CardDescription>
          </div>
          <Link href="/planner" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0">
            Planner <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-2">
        {isLoading ? (
          <CardSkeleton lines={3} />
        ) : error ? (
          <CardError />
        ) : visible.length > 0 ? (
          <>
            {visible.map((item, idx) => {
              const globalIdx = start + idx;
              const isCurrent = globalIdx === currentIdx;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-3 rounded-xl transition-all duration-300 border',
                    isCurrent
                      ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-purple-500/40 shadow-sm'
                      : 'bg-muted/50 border-transparent opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center justify-center h-9 w-9 rounded-lg shrink-0',
                      isCurrent ? 'bg-purple-500 text-white' : 'bg-muted text-muted-foreground'
                    )}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-bold text-xs',
                        isCurrent ? 'text-purple-700 dark:text-purple-300' : 'text-muted-foreground'
                      )}>
                        {item.startTime}
                      </p>
                      <p className="font-semibold text-sm text-foreground mt-0.5 truncate">{item.title}</p>
                    </div>
                    {item.tag && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">{item.tag}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
            {todayItems.length > 3 && (
              <p className="text-xs text-muted-foreground mt-1 pl-1">+{todayItems.length - 3} more items</p>
            )}
          </>
        ) : (
          <div className="text-center py-6 space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-3">
                <CalendarCheck className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">No tasks for today</p>
            <p className="text-xs text-muted-foreground">Add items in the Daily Planner</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Habit Streaks Card ──────────────────────────────────────────────────────
function HabitStreaksCard() {
  const { habits, updateHabit, isLoading, error } = useHabits();
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const activeHabits = habits.filter((h) => h.icon !== 'GlassWater' && h.habitType !== 'sprint');

  const toggleHabit = async (habit: Habit) => {
    const currentVal = habit.completions[todayKey];
    const done = typeof currentVal === 'boolean' ? currentVal : (typeof currentVal === 'number' ? currentVal >= (habit.target || 1) : false);
    const newCompletions = { ...habit.completions };

    if (typeof currentVal === 'number') {
      newCompletions[todayKey] = done ? 0 : (habit.target || 1);
    } else {
      newCompletions[todayKey] = !done;
    }
    await updateHabit({ id: habit.id, updates: { completions: newCompletions } });
  };

  const isCompleted = (habit: Habit) => {
    const val = habit.completions[todayKey];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val >= (habit.target || 1);
    return false;
  };

  const completedCount = activeHabits.filter(isCompleted).length;

  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-16 -mt-16" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Habit Streaks</CardTitle>
              <CardDescription className="text-xs">
                {isLoading ? 'Loading...' : activeHabits.length > 0 ? `${completedCount}/${activeHabits.length} done today` : 'Track your daily habits'}
              </CardDescription>
            </div>
          </div>
          <Link href="/habits" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 shrink-0">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <CardSkeleton lines={3} />
        ) : error ? (
          <CardError />
        ) : activeHabits.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {activeHabits.slice(0, 6).map((habit) => {
              const completed = isCompleted(habit);
              const streak = calculateStreak(habit.completions, habit.target || 1);
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left transition-all duration-200',
                    completed
                      ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 shadow-sm'
                      : 'bg-card border-border hover:border-orange-500/30 hover:shadow-sm'
                  )}
                >
                  <div className={cn(
                    'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200',
                    completed ? 'bg-green-500 border-green-500 scale-110' : 'border-muted-foreground/30'
                  )}>
                    {completed && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{habit.name}</p>
                    {streak > 0 && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <Flame className="h-2.5 w-2.5 text-orange-500" />
                        {streak}d streak
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-3">
                <Flame className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">No habits yet</p>
            <p className="text-xs text-muted-foreground">
              <Link href="/habits" className="underline hover:text-foreground">Create habits</Link> to track your streaks
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Water Intake Card ───────────────────────────────────────────────────────
function WaterIntakeCard() {
  const { habits, updateHabit, isLoading } = useHabits();
  const now = new Date();
  const todayKey = format(now, 'yyyy-MM-dd');

  const waterHabit = habits.find((h) => h.icon === 'GlassWater');

  // Still render the card shell when loading or when no water habit
  const ML_PER_GLASS = 250;
  const TARGET_GLASSES = waterHabit?.target || 8;
  const WATER_TARGET_ML = TARGET_GLASSES * ML_PER_GLASS;
  const glassesToday = waterHabit && typeof waterHabit.completions[todayKey] === 'number' ? (waterHabit.completions[todayKey] as number) : 0;
  const mlToday = glassesToday * ML_PER_GLASS;
  const progressPercent = WATER_TARGET_ML > 0 ? (mlToday / WATER_TARGET_ML) * 100 : 0;
  const isGoalMet = glassesToday >= TARGET_GLASSES;

  const handleDrink = async () => {
    if (!waterHabit) return;
    const newCompletions = { ...waterHabit.completions };
    const current = typeof newCompletions[todayKey] === 'number' ? (newCompletions[todayKey] as number) : 0;
    newCompletions[todayKey] = current + 1;
    await updateHabit({ id: waterHabit.id, updates: { completions: newCompletions } });
  };

  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
            <Droplets className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              Water Intake
              {isGoalMet && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </CardTitle>
            <CardDescription className="text-xs">{isLoading ? 'Loading...' : 'Stay hydrated today'}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-4">
        {isLoading ? (
          <CardSkeleton lines={3} />
        ) : !waterHabit ? (
          <div className="text-center py-6 space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-3">
                <GlassWater className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">No water tracking</p>
            <p className="text-xs text-muted-foreground">
              <Link href="/habits" className="underline hover:text-foreground">Add a water habit</Link> to start tracking
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold tracking-tight">
                  {mlToday}<span className="text-lg text-muted-foreground ml-1">ml</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">of {WATER_TARGET_ML}ml daily goal</p>
              </div>
              <button
                type="button"
                onClick={handleDrink}
                className="h-14 w-14 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950 flex items-center justify-center cursor-pointer"
              >
                <GlassWater className="h-7 w-7 text-blue-500" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{glassesToday} of {TARGET_GLASSES} glasses</span>
                <span className="font-semibold">{Math.min(progressPercent, 100).toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(progressPercent, 100)} className="h-2.5" />
            </div>

            {isGoalMet && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 text-center">
                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                  🎉 Daily goal achieved! Great job!
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Quick Links ─────────────────────────────────────────────────────────────
function QuickLinks() {
  const links = [
    { href: '/planner', icon: Clock, label: 'Planner', gradient: 'from-purple-500 to-pink-500' },
    { href: '/notes', icon: ListChecks, label: 'Notes', gradient: 'from-teal-500 to-cyan-500' },
    { href: '/habits', icon: Flame, label: 'Habits', gradient: 'from-orange-500 to-amber-500' },
    { href: '/ai-chat', icon: CheckCircle2, label: 'AI Chat', gradient: 'from-blue-500 to-indigo-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 bg-card hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
        >
          <div className={cn('p-2.5 rounded-lg bg-gradient-to-br text-white shadow-sm', link.gradient)}>
            <link.icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{link.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = now.getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [now]);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'there';

  return (
    <AppLayout>
      <div className="space-y-6 pb-6">
        {/* Greeting */}
        <header className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold font-headline bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {greeting}, {displayName}!
          </h1>
          <p className="text-muted-foreground text-sm">
            {format(now, "EEEE, MMMM d • h:mm a")}
          </p>
        </header>

        {/* Quick Links */}
        <QuickLinks />

        {/* Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TodoListCard />
          <TodaysPlanCard />
          <HabitStreaksCard />
          <WaterIntakeCard />
        </div>
      </div>
    </AppLayout>
  );
}
