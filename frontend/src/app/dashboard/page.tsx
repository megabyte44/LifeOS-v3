
'use client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Wallet, CalendarCheck, ListChecks, GlassWater, Settings, TrendingUp, TrendingDown, DollarSign, Target, Clock, Droplets, CheckCircle2, Sunrise, Sunset, Moon, ArrowRight, CalendarClock, GripVertical, Activity, Beef, Pill, Flame, Award, Zap, Plus, Minus, Edit, Check, X, Sparkles } from 'lucide-react';
import { P_TODO_ITEMS, P_HABITS, P_TRANSACTIONS } from '@/lib/placeholder-data';
import type { PlannerItem, TodoItem, Habit, Transaction, UserPreferences, ProteinIntake, LoggedFoodItem } from '@/types';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO, startOfMonth, parse } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OnboardingTour, dashboardTourSteps, profileMenuTourSteps } from '@/components/onboarding/OnboardingTour';
import { GymPreferencesDialog } from '@/components/onboarding/GymPreferencesDialog';
import { useRouter } from 'next/navigation';

// Sortable Widget Wrapper
function SortableWidget({ id, children, span }: { id: string; children: React.ReactNode; span: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group overflow-hidden", span)}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

function WaterIntakeWidget({ now }: { now: Date }) {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>(P_HABITS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const waterHabit = habits.find(h => h.icon === 'GlassWater');
  const [newTargetInput, setNewTargetInput] = useState(String(waterHabit?.target || 8));

  useEffect(() => {
    if (waterHabit) setNewTargetInput(String(waterHabit.target || 8));
  }, [waterHabit]);

  const handleHabitsUpdate = (updatedHabits: Habit[]) => {
      setHabits(updatedHabits);
  }

  const ML_PER_GLASS = 250;
  const TARGET_GLASSES = waterHabit?.target || 8;
  const WATER_TARGET_ML = TARGET_GLASSES * ML_PER_GLASS;

  const handleIntakeChange = () => {
    if (!waterHabit) return;
    const todayKey = format(now, 'yyyy-MM-dd');
    const updatedHabits = habits.map(h => {
      if (h.id === waterHabit.id) {
        const newCompletions = { ...h.completions };
        const currentCount = typeof newCompletions[todayKey] === 'number' ? (newCompletions[todayKey] as number) : 0;
        newCompletions[todayKey] = currentCount + 1;
        return { ...h, completions: newCompletions };
      }
      return h;
    });
    handleHabitsUpdate(updatedHabits);
  };
  
  const handleTargetSave = () => {
    if (!waterHabit) return;
    const newTarget = parseInt(newTargetInput, 10);
    if (!isNaN(newTarget) && newTarget > 0) {
        const updatedHabits = habits.map(h => h.id === waterHabit.id ? { ...h, target: newTarget } : h);
        handleHabitsUpdate(updatedHabits);
        setIsSettingsOpen(false);
    }
  };

  if (!waterHabit) return null;

  const todayKey = format(now, 'yyyy-MM-dd');
  const glassesToday = typeof waterHabit.completions[todayKey] === 'number' ? (waterHabit.completions[todayKey] as number) : 0;
  const mlToday = glassesToday * ML_PER_GLASS;
  const progressPercent = (mlToday / WATER_TARGET_ML) * 100;
  const isGoalMet = glassesToday >= TARGET_GLASSES;
  
  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
      {/* <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" /> */}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Water Intake
                {isGoalMet && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </CardTitle>
              <CardDescription className="text-xs">Stay hydrated today</CardDescription>
            </div>
          </div>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setIsSettingsOpen(true);
              }}
              className="h-10 w-10 rounded-full shadow-sm hover:shadow-md transition-all border border-input bg-background flex items-center justify-center cursor-pointer touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Settings className="h-5 w-5 pointer-events-none" />
            </button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set Water Intake Goal</DialogTitle>
                <DialogDescription>1 glass = 250ml. Aim for 8+ glasses daily.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-4">
                <Label htmlFor="water-target">Daily Glasses Target</Label>
                <Input 
                  id="water-target" 
                  type="number" 
                  value={newTargetInput} 
                  onChange={(e) => setNewTargetInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleTargetSave()} 
                />
              </div>
              <DialogFooter>
                <Button onClick={handleTargetSave}>Save Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold tracking-tight">
              {mlToday}<span className="text-lg text-muted-foreground ml-1">ml</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              of {WATER_TARGET_ML}ml goal
            </p>
          </div>
          <button 
            type="button"
            onClick={handleIntakeChange}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleIntakeChange();
            }}
            className="h-16 w-16 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950 flex items-center justify-center cursor-pointer touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <GlassWater className="h-8 w-8 text-blue-500 pointer-events-none" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{glassesToday} of {TARGET_GLASSES} glasses</span>
            <span className="font-semibold">{Math.min(progressPercent, 100).toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {isGoalMet && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              🎉 Daily goal achieved! Great job staying hydrated!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TodaysPlan({ now }: { now: Date }) {
  const { user } = useAuth();
  const [routineItems, setRoutineItems] = useState<PlannerItem[]>([]);
  const [displayedItems, setDisplayedItems] = useState<PlannerItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(1);
  
  useEffect(() => {
    // Mock routine items for display
    const dayName = format(now, 'EEEE');
    // Using empty array as placeholder since authentic data requires backend
    setRoutineItems([]);
  }, [user, now]);

  useEffect(() => {
    if (routineItems.length === 0) {
      setDisplayedItems([]);
      return;
    }
    // ... rest of the logic for calculating displayedItems ...
    const calculateDisplayedItems = () => {
      if (routineItems.length <= 3) {
        setDisplayedItems(routineItems);
        const currentIndex = routineItems.findLastIndex(item => {
            try { return parse(item.startTime, 'HH:mm', new Date()) <= now; } catch { return false; }
        });
        setHighlightedIndex(currentIndex);
        return;
      }

      let currentIndex = routineItems.findIndex(item => {
        try { return parse(item.startTime, 'HH:mm', new Date()) > now; } catch { return false; }
      });
      if (currentIndex === -1) currentIndex = routineItems.length - 1;

      let itemsToShow: PlannerItem[];
      if (currentIndex === 0) {
        itemsToShow = routineItems.slice(0, 3); setHighlightedIndex(0);
      } else if (currentIndex === routineItems.length - 1) {
        itemsToShow = routineItems.slice(routineItems.length - 3); setHighlightedIndex(2);
      } else {
        itemsToShow = routineItems.slice(currentIndex - 1, currentIndex + 2); setHighlightedIndex(1);
      }
      setDisplayedItems(itemsToShow);
    };
    calculateDisplayedItems();
  }, [routineItems, now]);

  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Today's Plan</CardTitle>
            <CardDescription className="text-xs">
              {routineItems.length} {routineItems.length === 1 ? 'task' : 'tasks'} scheduled
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {displayedItems.length > 0 ? (
          <div className="space-y-2">
            {displayedItems.map((item, index) => (
              <div 
                key={item.id} 
                className={cn(
                  'p-4 rounded-xl transition-all duration-500 ease-in-out border',
                  index === highlightedIndex 
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 shadow-md scale-[1.02]' 
                    : 'bg-muted/50 border-transparent opacity-60'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-lg shrink-0",
                    index === highlightedIndex ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-bold text-sm",
                      index === highlightedIndex ? "text-purple-700 dark:text-purple-300" : "text-muted-foreground"
                    )}>
                      {item.startTime}
                    </p>
                    <p className="font-semibold text-foreground mt-0.5">{item.title}</p>
                    {item.tag && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {item.tag}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <CalendarCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium">No tasks for today</p>
            <p className="text-xs text-muted-foreground">Add items in the Daily Planner</p>
          </div>
        )}
      </CardContent>

      {routineItems.length > 0 && (
        <CardFooter>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                View Full Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Full Plan for {format(now, 'EEEE')}</DialogTitle>
                <DialogDescription>Your complete schedule for today</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2 p-4">
                  {routineItems.map((item) => (
                    <div key={item.id} className="p-3 rounded-lg bg-muted border">
                      <div className="flex items-start gap-3">
                        <Badge variant="secondary" className="mt-0.5">{item.startTime}</Badge>
                        <div className="flex-1">
                          <p className="font-semibold">{item.title}</p>
                          {item.tag && <p className="text-sm text-muted-foreground mt-1">{item.tag}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
}

function FinancialSnapshot({ now }: { now: Date }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(P_TRANSACTIONS);
  const [monthlyBudget, setMonthlyBudget] = useState(5000000);

  const todaysExpenses = transactions.filter(t => t.type === 'expense' && isSameDay(parseISO(t.date), now)).reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const remaining = totalIncome - totalExpenses;
  const startOfCurrentMonth = startOfMonth(now);
  const monthlyExpenses = transactions.filter(t => t.type === 'expense' && parseISO(t.date) >= startOfCurrentMonth).reduce((sum, t) => sum + t.amount, 0);
  const budgetUsagePercent = monthlyBudget > 0 ? (monthlyExpenses / monthlyBudget) * 100 : 0;
  const isOverBudget = budgetUsagePercent > 100;

  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Financial Snapshot</CardTitle>
            <CardDescription className="text-xs">Your money at a glance</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Remaining Balance - Highlighted */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Balance</p>
              <p className={cn(
                "text-3xl font-bold tracking-tight",
                remaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                <span className="font-sans">₹</span>{(remaining / 100).toFixed(2)}
              </p>
            </div>
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              remaining >= 0 ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              {remaining >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-sans">₹</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Today's Expenses</p>
              <p className="text-lg font-bold"><span className="font-sans">₹</span>{(todaysExpenses / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Monthly Budget Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Monthly Budget</span>
            </div>
            <span className={cn(
              "font-semibold",
              isOverBudget ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )}>
              {budgetUsagePercent.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={Math.min(budgetUsagePercent, 100)} 
            className={cn("h-3", isOverBudget && "[&>*]:bg-red-500")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span><span className="font-sans">₹</span>{(monthlyExpenses / 100).toFixed(2)} spent</span>
            <span><span className="font-sans">₹</span>{(monthlyBudget / 100).toFixed(2)} budget</span>
          </div>
        </div>

        {isOverBudget && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              ⚠️ Over budget this month
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TodoList() {
    const { user } = useAuth();
    const [todos, setTodos] = useState<TodoItem[]>(P_TODO_ITEMS);
    const [isAddTodoDialogOpen, setIsAddTodoDialogOpen] = useState(false);
    const [newTodoText, setNewTodoText] = useState('');
    const [newTodoPriority, setNewTodoPriority] = useState<'high' | 'medium' | 'low'>('low');

    const handleTodosUpdate = (updatedTodos: TodoItem[]) => {
        setTodos(updatedTodos);
    };

    const toggleTodo = (id: string) => handleTodosUpdate(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    const deleteTodo = (id: string) => handleTodosUpdate(todos.filter(todo => todo.id !== id));
    
    const postponeTodo = (id: string) => {
        const updatedTodos = todos.map(todo => {
            if (todo.id === id) {
                // Mark as postponed and move to end of the list
                return { ...todo, postponed: true };
            }
            return todo;
        });
        // Move the postponed todo to the end
        const postponedTodo = updatedTodos.find(t => t.id === id);
        const otherTodos = updatedTodos.filter(t => t.id !== id);
        if (postponedTodo) {
            handleTodosUpdate([...otherTodos, postponedTodo]);
        }
    };

    const isTaskMissed = (todo: TodoItem): boolean => {
        if (todo.completed) return false;
        const now = new Date();
        const currentHour = now.getHours();
        
        // Check if task is missed based on commitment time
        if (todo.priority === 'high' && currentHour >= 12) return true; // Morning (before 12 PM)
        if (todo.priority === 'medium' && currentHour >= 19) return true; // Evening (before 7 PM)
        if (todo.priority === 'low' && currentHour >= 23) return true; // End of Day (before 11 PM)
        
        return false;
    };
    
    const addTodo = () => {
        if (newTodoText.trim() === '') return;
        const newTodo: TodoItem = { id: `todo-${Date.now()}`, text: newTodoText.trim(), completed: false, priority: newTodoPriority };
        handleTodosUpdate([newTodo, ...todos]);
        setNewTodoText(''); setNewTodoPriority('low'); setIsAddTodoDialogOpen(false);
    };

    const getCommitmentIcon = (priority?: 'high' | 'medium' | 'low') => {
        switch (priority) { 
            case 'high': return Sunrise; 
            case 'medium': return Sunset; 
            default: return Moon; 
        }
    };

    const getCommitmentLabel = (priority?: 'high' | 'medium' | 'low') => {
        switch (priority) { 
            case 'high': return 'Morning'; 
            case 'medium': return 'Evening'; 
            default: return 'End of Day'; 
        }
    };

    const getCommitmentColor = (priority?: 'high' | 'medium' | 'low') => {
        switch (priority) { 
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'; 
            case 'medium': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'; 
            default: return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'; 
        }
    };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-lg transition-all duration-300">
      {/* <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" /> */}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
              <ListChecks className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Today's Tasks</CardTitle>
              <CardDescription className="text-xs">
                {completedCount} of {totalCount} completed
              </CardDescription>
            </div>
          </div>
          <Dialog open={isAddTodoDialogOpen} onOpenChange={setIsAddTodoDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full shadow-md">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new task</DialogTitle>
                <DialogDescription>What do you need to get done?</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-todo-input">Task</Label>
                  <Input 
                    id="new-todo-input" 
                    value={newTodoText} 
                    onChange={(e) => setNewTodoText(e.target.value)} 
                    placeholder="e.g., Finish Q3 report" 
                    onKeyDown={(e) => e.key === 'Enter' && addTodo()} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-todo-priority">Commitment Time</Label>
                  <Select value={newTodoPriority} onValueChange={(value) => setNewTodoPriority(value as 'high' | 'medium' | 'low')}>
                    <SelectTrigger id="new-todo-priority">
                      <SelectValue placeholder="Select when to complete" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <Sunrise className="h-4 w-4" />
                          Morning
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Sunset className="h-4 w-4" />
                          Evening
                        </div>
                      </SelectItem>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          End of Day
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addTodo}>Add Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-4">
            <Progress value={(completedCount / totalCount) * 100} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="overflow-hidden">
        {todos.length > 0 ? (
          <ScrollArea className="h-[360px] w-full">
            <div className="space-y-2 pr-4">
              {todos.map(todo => {
                const CommitmentIcon = getCommitmentIcon(todo.priority);
                const isMissed = isTaskMissed(todo);
                const isPostponed = todo.postponed && !todo.completed;
                
                // Determine border and text color based on state
                let borderColor = "border-transparent";
                let textColor = "text-foreground";
                let checkboxColor = "";
                
                if (!todo.completed) {
                  if (isMissed) {
                    borderColor = "border-red-500/70";
                    textColor = "text-red-600 dark:text-red-400 font-medium";
                    checkboxColor = "border-red-500 data-[state=checked]:bg-red-500";
                  } else if (isPostponed) {
                    borderColor = "border-orange-500/70";
                    textColor = "text-orange-600 dark:text-orange-400 font-medium";
                    checkboxColor = "border-orange-500 data-[state=checked]:bg-orange-500";
                  } else {
                    borderColor = "border-blue-500/30";
                    textColor = "text-foreground font-medium";
                    checkboxColor = "border-blue-500";
                  }
                }
                
                return (
                  <div 
                    key={todo.id} 
                    className={cn(
                      "group flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-300",
                      todo.completed 
                        ? "bg-muted/50 opacity-75 hover:opacity-100 border-transparent" 
                        : `bg-card hover:shadow-md ${borderColor}`
                    )}
                  >
                    <Checkbox 
                      id={`todo-${todo.id}`} 
                      checked={todo.completed} 
                      onCheckedChange={() => toggleTodo(todo.id)}
                      className={cn("mt-1", !todo.completed && checkboxColor)}
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={`todo-${todo.id}`} 
                        className={cn(
                          "text-sm cursor-pointer leading-relaxed block",
                          todo.completed ? "line-through text-muted-foreground" : textColor
                        )}
                      >
                        {todo.text}
                      </label>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {/* Commitment Time Badge */}
                        {todo.priority && (
                          <Badge 
                            className={cn("text-xs flex items-center gap-1", getCommitmentColor(todo.priority))}
                          >
                            <CommitmentIcon className="h-3 w-3" />
                            {getCommitmentLabel(todo.priority)}
                          </Badge>
                        )}
                        
                        {/* Status Badges */}
                        {!todo.completed && isMissed && (
                          <Badge 
                            variant="destructive"
                            className="text-xs"
                          >
                            Missed
                          </Badge>
                        )}
                        
                        {!todo.completed && isPostponed && (
                          <Badge 
                            className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          >
                            Postponed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!todo.completed && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-orange-600 dark:text-orange-400" 
                          onClick={() => postponeTodo(todo.id)}
                          title="Postpone task"
                        >
                          <CalendarClock className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive" 
                        onClick={() => deleteTodo(todo.id)}
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <ListChecks className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium">No tasks yet</p>
            <p className="text-xs text-muted-foreground">Click the button above to add your first task</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Protein Intake Widget
function ProteinIntakeWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const [proteinIntakes, setProteinIntakes] = useState<ProteinIntake[]>([]);
  const [proteinTarget, setProteinTarget] = useState(150);
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const todaysIntakes = proteinIntakes.filter(i => i.date === todayKey);
  const totalProtein = todaysIntakes.reduce((sum, item) => sum + item.amount, 0);
  const progress = Math.min(100, Math.round((totalProtein / proteinTarget) * 100));

  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-102 cursor-pointer border-t-4 hover:border-blue-400"
      style={{ borderTopColor: 'hsl(var(--blue-500))' }}
      onClick={() => router.push('/gym')}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-headline">Protein Intake</CardTitle>
              <CardDescription className="text-xs">Today's consumption</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {totalProtein}g
            </p>
            <p className="text-xs text-muted-foreground">of {proteinTarget}g</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 relative">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {todaysIntakes.length > 0 ? (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Today's logs ({todaysIntakes.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {todaysIntakes.slice(-5).map(intake => (
                <Badge key={intake.id} variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300">
                  {intake.amount}g
                </Badge>
              ))}
              {todaysIntakes.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{todaysIntakes.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t text-center py-3">
            <p className="text-xs text-muted-foreground">No protein logged today</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Click to add logs in Forge</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Supplement Intake Widget
function SupplementIntakeWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const [loggedItems, setLoggedItems] = useState<LoggedFoodItem[]>([]);
  const [customItems, setCustomItems] = useState<string[]>(['Protein Powder', 'Creatine', 'Multivitamin', 'Omega-3', 'Vitamin D']);
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  const todaysSupplements = loggedItems.filter(i => i.date === todayKey);
  const takenSupplements = Array.from(new Set(todaysSupplements.map(item => item.name)));
  const notTakenSupplements = customItems.filter(item => !takenSupplements.includes(item));

  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-102 cursor-pointer border-t-4 hover:border-purple-400"
      style={{ borderTopColor: 'hsl(var(--purple-500))' }}
      onClick={() => router.push('/gym')}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
              <Pill className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-headline">Supplements</CardTitle>
              <CardDescription className="text-xs">Track your daily intake</CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300"
          >
            {takenSupplements.length}/{customItems.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 relative">
        {/* Taken Supplements */}
        {takenSupplements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              Taken Today
            </h4>
            <div className="space-y-1.5">
              {takenSupplements.map(item => (
                <div 
                  key={item}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/30"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not Taken Supplements */}
        {notTakenSupplements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Pending
            </h4>
            <div className="space-y-1.5">
              {notTakenSupplements.map(item => (
                <div 
                  key={item}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {customItems.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No supplements configured</p>
            <p className="text-xs mt-1">Click to set up in Forge</p>
          </div>
        )}

        {/* All Taken State */}
        {customItems.length > 0 && takenSupplements.length === customItems.length && (
          <div className="text-center py-2 mt-2 border-t">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ All supplements taken today!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [now, setNow] = useState(new Date());
  const [preferences, setPreferences] = useState<UserPreferences>({
    features: {
      waterIntake: true,
      todaysPlan: true,
      financialSnapshot: true,
      todoList: true,
      habitStreaks: true,
      gymTracker: false,
      proteinIntake: false,
      foodSupplements: false,
      overloadTracker: true,
      gymProteinIntake: true,
      gymFoodSupplements: true,
      proteinIntakeWidget: false,
      supplementIntakeWidget: false,
    }
  });
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    'habitStreaks',
    'waterIntake',
    'todaysPlan',
    'financialSnapshot',
    'todoList'
  ]);

  // Onboarding state
  const [showDashboardTour, setShowDashboardTour] = useState(false);
  const [showProfileTour, setShowProfileTour] = useState(false);
  const [showGymPreferences, setShowGymPreferences] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [now, setNow] = useState(new Date());
  const [preferences, setPreferences] = useState<UserPreferences>({
    features: {
      waterIntake: true,
      todaysPlan: true,
      financialSnapshot: true,
      todoList: true,
      habitStreaks: true,
      gymTracker: false,
      proteinIntake: false,
      foodSupplements: false,
      overloadTracker: true,
      gymProteinIntake: true,
      gymFoodSupplements: true,
      proteinIntakeWidget: false,
      supplementIntakeWidget: false,
    }
  });
  const [widgetOrder, setWidgetOrder] = useState<string[]>([
    'habitStreaks',
    'waterIntake',
    'todaysPlan',
    'financialSnapshot',
    'todoList'
  ]);

  // Onboarding state
  const [showDashboardTour, setShowDashboardTour] = useState(false);
  const [showProfileTour, setShowProfileTour] = useState(false);
  const [showGymPreferences, setShowGymPreferences] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!user) return;
    
    // Set username from auth
    setUsername(user.displayName || user.email?.split('@')[0] || 'User');
    
    const timer = setInterval(() => setNow(new Date()), 60000);
    
    return () => { 
      clearInterval(timer); 
    };
  }, [user]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const hour = now.getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [now]);

  // Onboarding handlers (Mocked for now)
  const handleDashboardTourComplete = async () => {
    setShowDashboardTour(false);
    // Show profile tour next
    setTimeout(() => setShowProfileTour(true), 500);
  };

  const handleProfileTourComplete = async () => {
    setShowProfileTour(false);
    // Show gym preferences dialog next
    setTimeout(() => setShowGymPreferences(true), 500);
  };

  const handleGymPreferencesComplete = async (isGymFreak: boolean) => {
    setShowGymPreferences(false);
    setPreferences(prev => ({
      ...prev,
      features: {
        ...prev.features,
        gymTracker: isGymFreak,
        proteinIntake: isGymFreak,
        foodSupplements: isGymFreak,
      }
    }));
  };

  const handleSkipOnboarding = async () => {
    setShowDashboardTour(false);
    setShowProfileTour(false);
    setShowGymPreferences(false
        )}

        <header className="space-y-2">
          {username ? (
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-bold font-headline bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                {greeting}, {username}!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Let's make today count, {format(now, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-10 w-3/5" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          )}
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleWidgets}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {visibleWidgets.map((widgetId) => {
                const config = widgetConfig[widgetId];
                if (!config) return null;
                return (
                  <SortableWidget key={widgetId} id={widgetId} span={config.span}>
                    {config.component}
                  </SortableWidget>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Onboarding Components */}
      {user && (
        <>
          <OnboardingTour
            steps={dashboardTourSteps}
            show={showDashboardTour}
            onComplete={handleDashboardTourComplete}
            onSkip={handleSkipOnboarding}
          />
          <OnboardingTour
            steps={profileMenuTourSteps}
            show={showProfileTour}
            onComplete={handleProfileTourComplete}
            onSkip={handleSkipOnboarding}
          />
          <GymPreferencesDialog
            show={showGymPreferences}
            userId={user.uid}
            onComplete={handleGymPreferencesComplete}
            onSkip={handleSkipOnboarding}
          />
        </>
      )}
    </AppLayout>
  );
}
