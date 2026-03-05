
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Habit, Goal, SubGoal, ProgressTracker, GoalCategory } from '@/types';
import { useHabits, useGoals } from '@/hooks/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    PlusCircle, Flame, List, CalendarDays, Edit, Apple, Settings, Trash2, Check, 
    AlertTriangle, Droplets, Plus, Minus, BookOpenCheck, Bed, Footprints, 
    Sunrise, Guitar, Code, Leaf, CheckCircle2, GlassWater, TrendingUp, BarChart2, Zap, Target, Clock,
    Trophy, Award, TrendingDown, Activity, Calendar as CalendarIcon, X, Info, ChevronDown, ChevronRight,
    Star, Circle, Archive, ArchiveRestore, BookOpen, Link2, ExternalLink, ArrowRight, Layers, ListOrdered, Flag
} from 'lucide-react';
import { subDays, format, isSameDay, parseISO, differenceInCalendarDays } from 'date-fns';
import { calculateStreak, cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '@/hooks/use-auth';


const iconMap: Record<string, React.ElementType> = {
    PlusCircle, Flame, List, CalendarDays, Edit, Apple, Settings, Trash2, Check, 
    AlertTriangle, Droplets, Plus, Minus, BookOpenCheck, Bed, Footprints, 
    Sunrise, Guitar, Code, Leaf, CheckCircle2, GlassWater, TrendingUp
};

// Hierarchy SubGoal Item Component (Recursive)
function HierarchySubGoalItem({ 
  subGoal, 
  allSubGoals,
  level = 0, 
  isEditMode,
  onToggleComplete,
  onDelete,
  onAddChild,
  onUpdateText
}: { 
  subGoal: SubGoal; 
  allSubGoals: SubGoal[];
  level?: number;
  isEditMode: boolean;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onUpdateText: (id: string, title: string, description?: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(!subGoal.title); // Auto-edit if no title
  const [editTitle, setEditTitle] = useState(subGoal.title);
  const [editDescription, setEditDescription] = useState(subGoal.description || '');
  const children = allSubGoals.filter(sg => sg.parentId === subGoal.id).sort((a, b) => a.order - b.order);
  const hasChildren = children.length > 0;
  const indentLevel = level * 24; // 24px per level

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdateText(subGoal.id, editTitle.trim(), editDescription.trim() || undefined);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(subGoal.title);
      setEditDescription(subGoal.description || '');
    }
  };

  return (
    <div className="group relative" style={{ marginLeft: `${indentLevel}px` }}>
      {/* Tree Connection Lines */}
      {level > 0 && (
        <>
          {/* Horizontal line to parent */}
          <div 
            className="absolute left-[-12px] top-[20px] w-3 h-0.5 bg-blue-300 dark:bg-blue-700"
            style={{ left: `${-12}px` }}
          />
          {/* Vertical line from parent (only if not last child) */}
          <div 
            className="absolute left-[-12px] top-0 w-0.5 bg-blue-300 dark:bg-blue-700"
            style={{ 
              left: `${-12}px`,
              height: hasChildren || !isExpanded ? 'calc(100% + 12px)' : '20px'
            }}
          />
        </>
      )}
      
      <Card className={cn(
        "mb-3 transition-all duration-200 border-l-4 relative",
        subGoal.completed 
          ? "bg-green-50/50 dark:bg-green-950/10 border-l-green-500" 
          : "hover:shadow-md hover:border-l-blue-400 border-l-blue-200 dark:border-l-blue-800"
      )}>
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            {/* Expand/Collapse Icon */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
              {hasChildren ? (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <ChevronRight className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )} />
                </button>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </div>

            {/* Checkbox */}
            <div 
              className={cn(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all mt-0.5 shadow-sm",
                subGoal.completed
                  ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 scale-105"
                  : "border-border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:scale-105"
              )}
              onClick={() => onToggleComplete(subGoal.id)}
            >
              {subGoal.completed && (
                <Check className="h-4 w-4 text-white font-bold" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {isEditing && isEditMode ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter title..."
                    className="h-8 sm:h-9 text-sm font-medium"
                    autoFocus
                  />
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Description (optional)..."
                    className="h-7 sm:h-8 text-xs"
                  />
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="h-7 sm:h-8 text-xs"
                      disabled={!editTitle.trim()}
                    >
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!subGoal.title) {
                          onDelete(subGoal.id);
                        } else {
                          setIsEditing(false);
                          setEditTitle(subGoal.title);
                          setEditDescription(subGoal.description || '');
                        }
                      }}
                      className="h-7 sm:h-8 text-xs"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p 
                    className={cn(
                      "text-sm font-semibold cursor-pointer transition-colors",
                      subGoal.completed && "text-muted-foreground/70 line-through"
                    )}
                    onClick={() => isEditMode && setIsEditing(true)}
                  >
                    {subGoal.title || 'Untitled'}
                  </p>
                  {subGoal.description && (
                    <p className={cn(
                      "text-xs text-muted-foreground mt-1",
                      subGoal.completed && "opacity-60"
                    )}>
                      {subGoal.description}
                    </p>
                  )}
                  {subGoal.completedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed {format(parseISO(subGoal.completedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Actions - Only show when editing */}
            {isEditMode && !isEditing && (
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => setIsEditing(true)}
                  title="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  onClick={() => onAddChild(subGoal.id)}
                  title="Add sub-item"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(subGoal.id)}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Render children recursively */}
      {hasChildren && isExpanded && (
        <div>
          {children.map(child => (
            <HierarchySubGoalItem
              key={child.id}
              subGoal={child}
              allSubGoals={allSubGoals}
              level={level + 1}
              isEditMode={isEditMode}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onUpdateText={onUpdateText}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Step-by-Step SubGoal Item Component
function StepByStepSubGoalItem({ 
  subGoal,
  index,
  isLast,
  isEditMode,
  onToggleComplete,
  onDelete,
  onUpdateText
}: {
  subGoal: SubGoal;
  index: number;
  isLast: boolean;
  isEditMode: boolean;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateText: (id: string, title: string, description?: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(!subGoal.title);
  const [editTitle, setEditTitle] = useState(subGoal.title);
  const [editDescription, setEditDescription] = useState(subGoal.description || '');

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdateText(subGoal.id, editTitle.trim(), editDescription.trim() || undefined);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      if (!subGoal.title) {
        onDelete(subGoal.id);
      } else {
        setIsEditing(false);
        setEditTitle(subGoal.title);
        setEditDescription(subGoal.description || '');
      }
    }
  };

  return (
    <div className="flex items-start gap-3 sm:gap-5 relative group pb-4 sm:pb-6">
      {/* Vertical Timeline Line with gradient */}
      {!isLast && (
        <div className="absolute left-[11px] sm:left-[13px] top-8 sm:top-10 w-0.5 h-full bg-gradient-to-b from-blue-400 via-blue-300 to-transparent dark:from-blue-600 dark:via-blue-700" />
      )}
      
      {/* Timeline Dot - Enhanced */}
      <div className="relative z-10 mt-0.5 sm:mt-1">
        <div className={cn(
          "w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 sm:border-3 flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-md",
          subGoal.completed 
            ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-300 dark:border-green-600 scale-110" 
            : "bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 hover:scale-110 hover:border-blue-500"
        )}>
          {subGoal.completed ? (
            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white font-bold" />
          ) : (
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-400" />
          )}
        </div>
      </div>
      
      {/* Step Content Card */}
      <Card className={cn(
        "flex-1 transition-all duration-200 border-l-4",
        subGoal.completed 
          ? "bg-green-50/40 dark:bg-green-950/10 border-l-green-500" 
          : "hover:shadow-lg hover:border-l-blue-400 border-l-blue-200 dark:border-l-blue-800"
      )}>
        <CardContent className="p-2 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              {isEditing && isEditMode ? (
                <div className="space-y-1.5 sm:space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter step title..."
                    className="h-8 sm:h-10 text-sm font-medium"
                    autoFocus
                  />
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Description (optional)..."
                    className="h-7 sm:h-9 text-xs"
                  />
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="h-8 sm:h-9 text-xs"
                      disabled={!editTitle.trim()}
                    >
                      <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!subGoal.title) {
                          onDelete(subGoal.id);
                        } else {
                          setIsEditing(false);
                          setEditTitle(subGoal.title);
                          setEditDescription(subGoal.description || '');
                        }
                      }}
                      className="h-8 sm:h-9 text-xs"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Badge variant="secondary" className="text-xs font-medium mt-0.5 sm:mt-1 flex-shrink-0">
                      Step {index + 1}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className={cn(
                          "text-sm sm:text-base font-semibold cursor-pointer transition-colors break-words leading-tight",
                          subGoal.completed && "text-muted-foreground/70 line-through"
                        )}
                        onClick={() => isEditMode && setIsEditing(true)}
                      >
                        {subGoal.title || 'Untitled'}
                      </h4>
                      {subGoal.description && (
                        <p className={cn(
                          "text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 break-words leading-snug",
                          subGoal.completed && "opacity-60"
                        )}>
                          {subGoal.description}
                        </p>
                      )}
                      {subGoal.completedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 sm:mt-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                          <span className="truncate">Completed {format(parseISO(subGoal.completedAt), 'MMM d, yyyy')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Checkbox */}
              <div 
                className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all shadow-sm",
                  subGoal.completed
                    ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 scale-105"
                    : "border-border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:scale-105"
                )}
                onClick={() => onToggleComplete(subGoal.id)}
              >
                {subGoal.completed && (
                  <Check className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 text-white font-bold" />
                )}
              </div>
              
              {/* Edit & Delete Buttons - Only show when editing */}
              {isEditMode && !isEditing && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditing(true)}
                    title="Edit"
                  >
                    <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={() => onDelete(subGoal.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HabitsPage() {
  const { user } = useAuth();
  const {
    habits,
    isLoading: habitsLoading,
    addHabit: addHabitApi,
    updateHabit: updateHabitApi,
    deleteHabit: deleteHabitApi,
  } = useHabits();
  const {
    goals: apiGoals,
    isLoading: goalsLoading,
    addGoal: addGoalApi,
    updateGoal: updateGoalApi,
  } = useGoals();
  const isLoading = habitsLoading || goalsLoading;

  // Local goals state synced from API for optimistic updates
  const [goals, setGoals] = useState<Goal[]>([]);
  useEffect(() => { setGoals(apiGoals); }, [apiGoals]);

  // Core State
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isEditHabitDialogOpen, setIsEditHabitDialogOpen] = useState(false);
  const [isAddHabitDialogOpen, setIsAddHabitDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  
  // Collapse states - all collapsed by default
  const [isStreakBookCollapsed, setIsStreakBookCollapsed] = useState(true);
  const [isGoalsCollapsed, setIsGoalsCollapsed] = useState(true);
  
  // Goals state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalsViewMode, setGoalsViewMode] = useState<'list' | 'detail'>('list');
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [newGoalStep, setNewGoalStep] = useState<'type' | 'details'>('type');
  const [newGoalType, setNewGoalType] = useState<'step-by-step' | 'hierarchy' | 'milestone' | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>('Other');
  const [newGoalMotive, setNewGoalMotive] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [isEditingGoalName, setIsEditingGoalName] = useState(false);
  const [editedGoalName, setEditedGoalName] = useState('');
  
  // Ref for goal title input
  const goalTitleInputRef = React.useRef<HTMLInputElement>(null);
  
  // Add Step Dialog State
  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  
  // Derived state
  const todayKey = format(new Date(), 'yyyy-MM-dd');


  // Auto-focus goal title input when goal type is selected
  useEffect(() => {
    if (newGoalType && newGoalStep === 'details' && goalTitleInputRef.current) {
      // Small delay to ensure the input is rendered
      const timer = setTimeout(() => {
        goalTitleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [newGoalType, newGoalStep]);

  // --- Handlers that save to Firestore ---
  const handleToggleCompletion = async (habitId: string, date: string) => {
    if (!isSameDay(parseISO(date), new Date())) return;
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newCompletions = { ...habit.completions };
    // Use 'in' operator so a falsy value (e.g. 0 for numeric-target habits)
    // is still treated as "already completed" and gets deleted on toggle.
    if (date in newCompletions) delete newCompletions[date];
    else newCompletions[date] = true;
    await updateHabitApi({ id: habitId, updates: { completions: newCompletions } });
  };

  const handleSaveHabitName = async (habitId: string, newName: string) => {
    await updateHabitApi({ id: habitId, updates: { name: newName } });
  };
  
  const handleDeleteHabit = async () => {
    if (!habitToDelete) return;
    await deleteHabitApi(habitToDelete.id);
    setHabitToDelete(null);
  };

  const handleAddHabit = async (
    name: string, 
    icon: string, 
    habitType?: 'repetitive' | 'sprint', 
    sprintDuration?: number, 
    sprintEndDate?: string
  ) => {
    const newHabit: Omit<Habit, 'id'> = {
      name, 
      icon, 
      completions: {},
      habitType: habitType || 'repetitive',
    };
    
    if (habitType === 'sprint') {
      newHabit.sprintStartDate = format(new Date(), 'yyyy-MM-dd');
      if (sprintDuration) {
        newHabit.sprintDuration = sprintDuration;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + sprintDuration);
        newHabit.sprintEndDate = format(endDate, 'yyyy-MM-dd');
      } else if (sprintEndDate) {
        newHabit.sprintEndDate = sprintEndDate;
        const start = new Date();
        const end = parseISO(sprintEndDate);
        newHabit.sprintDuration = differenceInCalendarDays(end, start) + 1;
      }
    }
    
    await addHabitApi(newHabit);
  };

  // Filter out gym-related habit icons
  const filteredHabits = habits.filter(h => {
    // Always exclude gym-related habits
    if (['GlassWater', 'Beef', 'Pill', 'UtensilsCrossed', 'Dumbbell'].includes(h.icon)) return false;
    return true;
  });

  // Goals helper functions
  const calculateGoalProgress = (goal: Goal): number => {
    if (goal.completedAt) return 100;
    const percentageTracker = goal.progressTrackers.find(t => t.type === 'percentage');
    if (percentageTracker && percentageTracker.current !== undefined) {
      return percentageTracker.current;
    }
    if (goal.subGoals.length > 0) {
      const completed = goal.subGoals.filter(sg => sg.completed).length;
      return Math.round((completed / goal.subGoals.length) * 100);
    }
    return 0;
  };

  const getCategoryColor = (category: GoalCategory): string => {
    const colors: Record<GoalCategory, string> = {
      'Career': 'bg-blue-500',
      'Health & Fitness': 'bg-green-500',
      'Personal Development': 'bg-purple-500',
      'Education': 'bg-yellow-500',
      'Finance': 'bg-emerald-500',
      'Relationships': 'bg-pink-500',
      'Creativity': 'bg-orange-500',
      'Lifestyle': 'bg-cyan-500',
      'Other': 'bg-gray-500'
    };
    return colors[category] || colors.Other;
  };

  const saveGoals = async (updatedGoals: Goal[]) => {
    setGoals(updatedGoals); // optimistic local update
    for (const updatedGoal of updatedGoals) {
      const original = apiGoals.find(g => g.id === updatedGoal.id);
      if (!original || JSON.stringify(original) !== JSON.stringify(updatedGoal)) {
        try {
          await updateGoalApi({ id: updatedGoal.id, updates: updatedGoal });
        } catch (e) { console.error('Failed to update goal', e); }
      }
    }
  };

  const handleToggleSubGoal = async (goalId: string, subGoalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const updatedSubGoals = goal.subGoals.map(sg => 
      sg.id === subGoalId 
        ? { ...sg, completed: !sg.completed, completedAt: !sg.completed ? new Date().toISOString() : undefined }
        : sg
    );
    const updatedGoal = { ...goal, subGoals: updatedSubGoals, updatedAt: new Date().toISOString() };
    setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
    if (selectedGoal && selectedGoal.id === goalId) setSelectedGoal(updatedGoal);
    try { await updateGoalApi({ id: goalId, updates: { subGoals: updatedSubGoals } }); }
    catch (e) { console.error(e); }
  };

  const handleCreateGoal = async () => {
    if (!newGoalTitle.trim()) return;

    const newGoalPayload: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      motive: newGoalMotive.trim(),
      description: newGoalDescription.trim(),
      goalType: newGoalType || 'step-by-step',
      progressTrackers: newGoalType === 'step-by-step' 
        ? [{ id: 'tracker-1', type: 'percentage', label: 'Overall Progress', current: 0, order: 1 }]
        : newGoalType === 'milestone'
        ? [{ id: 'tracker-1', type: 'fraction', label: 'Checkpoints Completed', current: 0, target: 0, order: 1 }]
        : [{ id: 'tracker-1', type: 'colorStatus', label: 'Status', status: 'not-started', order: 1 }],
      subGoals: [],
      notes: [],
      resources: [],
      linkedHabitIds: [],
      archived: false
    };

    const savedGoal = await addGoalApi(newGoalPayload);
    setGoals(prev => [...prev, savedGoal]);

    // Reset form
    setNewGoalTitle('');
    setNewGoalCategory('Other');
    setNewGoalMotive('');
    setNewGoalDescription('');
    setNewGoalType(null);
    setNewGoalStep('type');
    setIsAddGoalDialogOpen(false);
  };

  const activeGoals = useMemo(() => goals.filter(g => !g.archived), [goals]);


  return (
    <AppLayout>
      {isLoading ? (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
      ) : (
      <>
      <div className="space-y-6">
        {/* Goals Section */}
        <Card>
          <CardContent className="p-0">
            {/* Goals Header */}
            <header 
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-blue-500/5 border-b border-blue-500/20"
            >
              <div 
                className="flex items-center gap-3 cursor-pointer group flex-1"
                onClick={() => setIsGoalsCollapsed(!isGoalsCollapsed)}
              >
                <div className="p-2 rounded-lg bg-blue-500/20 group-hover:scale-110 transition-transform">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-headline">Goals</h2>
                  <p className="text-sm text-muted-foreground">
                    {isGoalsCollapsed 
                      ? `${activeGoals.length} active ${activeGoals.length === 1 ? 'goal' : 'goals'} • Click to expand`
                      : goalsViewMode === 'list' 
                        ? 'Track your long-term aspirations' 
                        : `Viewing: ${selectedGoal?.title}`
                    }
                  </p>
                </div>
              </div>
              {!isGoalsCollapsed && (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {goalsViewMode === 'list' && (
                    <Button 
                      onClick={() => setIsAddGoalDialogOpen(true)}
                      size="sm"
                      className="h-9 px-3 shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <PlusCircle className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Add Goal</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  )}
                </div>
              )}
            </header>

            {/* Goals Content */}
            {!isGoalsCollapsed && (
                <div className="p-4">
                  {goalsViewMode === 'list' && (
                    <div className="space-y-4">
                      {activeGoals.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <Target className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">Start tracking your long-term aspirations and milestones</p>
                          <Button onClick={() => setIsAddGoalDialogOpen(true)} className="bg-blue-500 hover:bg-blue-600">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create Your First Goal
                          </Button>
                        </div>
                      ) : (
                        <ScrollArea className="h-[450px]">
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 pr-4">
                            {activeGoals.map(goal => {
                            const progress = calculateGoalProgress(goal);
                            const completedSubGoals = goal.subGoals.filter(sg => sg.completed).length;
                            const linkedGoalHabits = habits.filter(h => goal.linkedHabitIds.includes(h.id));
                            const totalStreak = linkedGoalHabits.reduce((sum, habit) => {
                              let streak = 0;
                              let currentDate = new Date();
                              while (habit.completions[format(currentDate, 'yyyy-MM-dd')]) {
                                streak++;
                                currentDate.setDate(currentDate.getDate() - 1);
                              }
                              return sum + streak;
                            }, 0);
                            const daysUntilTarget = goal.targetDate ? differenceInCalendarDays(parseISO(goal.targetDate), new Date()) : null;

                            return (
                              <Card 
                                key={goal.id}
                                className="group relative overflow-hidden border-l-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                style={{ borderLeftColor: `hsl(var(--${getCategoryColor(goal.category).replace('bg-', '')}))` }}
                                onClick={() => {
                                  setSelectedGoal(goal);
                                  setIsEditingGoalName(false);
                                  setGoalsViewMode('detail');
                                }}
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                      <CardTitle className="text-lg font-headline line-clamp-1">{goal.title}</CardTitle>
                                    </div>
                                    <Badge 
                                      variant="secondary"
                                      className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300"
                                    >
                                      {progress}%
                                    </Badge>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="space-y-3 pb-3">
                                  {/* Sequential Steps */}
                                  {goal.subGoals.length > 0 && (
                                    <div 
                                      className="space-y-2 cursor-pointer" 
                                      onClick={() => {
                                        setSelectedGoal(goal);
                                        setGoalsViewMode('detail');
                                      }}
                                    >
                                      <ScrollArea className="max-h-[200px]">
                                        <div className="space-y-2 pr-2">
                                          {goal.subGoals
                                            .filter(sg => !sg.completed)
                                            .sort((a, b) => a.order - b.order)
                                            .slice(0, 5)
                                            .map((subGoal, index, activeSteps) => (
                                              <div key={subGoal.id} className="flex items-start gap-2">
                                                <div className="flex flex-col items-center pt-0.5">
                                                  <div className={cn(
                                                    "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                                                    index === 0
                                                      ? "bg-gradient-to-br from-indigo-500 to-purple-500"
                                                      : "border-2 border-border"
                                                  )}>
                                                    {index === 0 && (
                                                      <Check 
                                                        className="h-2.5 w-2.5 text-white cursor-pointer" 
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const updatedSubGoals = goal.subGoals.map(sg =>
                                                            sg.id === subGoal.id
                                                              ? { ...sg, completed: true, completedAt: new Date().toISOString() }
                                                              : sg
                                                          );
                                                          const updatedGoals = goals.map(g =>
                                                            g.id === goal.id
                                                              ? { ...g, subGoals: updatedSubGoals, updatedAt: new Date().toISOString() }
                                                              : g
                                                          );
                                                          saveGoals(updatedGoals);
                                                        }}
                                                      />
                                                    )}
                                                  </div>
                                                  {index < activeSteps.length - 1 && index < 4 && (
                                                    <div className="w-0.5 flex-1 min-h-[20px] bg-border mt-0.5" />
                                                  )}
                                                </div>
                                                <p className={cn(
                                                  "text-sm flex-1 line-clamp-1",
                                                  index === 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                                                )}>
                                                  {subGoal.title}
                                                </p>
                                              </div>
                                            ))}
                                          {goal.subGoals.filter(sg => !sg.completed).length > 5 && (
                                            <p className="text-xs text-muted-foreground text-center pt-1">
                                              +{goal.subGoals.filter(sg => !sg.completed).length - 5} more steps
                                            </p>
                                          )}
                                        </div>
                                      </ScrollArea>
                                      {completedSubGoals > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                                          <span>{completedSubGoals} completed</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Resources Section */}
                                  {goal.resources.length > 0 && (
                                    <div className="pt-2 border-t">
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                        <Link2 className="h-3 w-3" />
                                        <span className="font-medium">Resources ({goal.resources.length})</span>
                                      </div>
                                      <div className="space-y-1">
                                        {goal.resources.slice(0, 2).map((resource) => (
                                          <div 
                                            key={resource.id}
                                            className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (resource.url) window.open(resource.url, '_blank');
                                            }}
                                          >
                                            <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                            <span className="line-clamp-1 flex-1">{resource.title}</span>
                                          </div>
                                        ))}
                                        {goal.resources.length > 2 && (
                                          <p 
                                            className="text-xs text-blue-500 hover:underline cursor-pointer pl-5"
                                            onClick={() => {
                                              setSelectedGoal(goal);
                                              setGoalsViewMode('detail');
                                            }}
                                          >
                                            +{goal.resources.length - 2} more
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Other Info */}
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                                    {linkedGoalHabits.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Flame className="h-3 w-3 text-orange-500" />
                                        <span>{linkedGoalHabits.length} habits</span>
                                      </div>
                                    )}
                                    {goal.notes.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        <span>{goal.notes.length} notes</span>
                                      </div>
                                    )}
                                    {goal.targetDate && daysUntilTarget !== null && (
                                      <div className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3" />
                                        <span>{daysUntilTarget > 0 ? `${daysUntilTarget}d left` : 'Overdue'}</span>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}

                  {/* Goal Detail View - Timeline Chain */}
                  {goalsViewMode === 'detail' && selectedGoal && (() => {
                    const completedCount = selectedGoal.subGoals.filter(sg => sg.completed).length;
                    const totalCount = selectedGoal.subGoals.length;
                    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    const allSteps = selectedGoal.subGoals.sort((a, b) => a.order - b.order);
                    
                    return (
                      <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="pb-4 border-b">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div 
                              className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setGoalsViewMode('list');
                                setSelectedGoal(null);
                                setIsEditingGoalName(false);
                              }}
                            >
                              <div className="p-2 rounded-lg bg-blue-500/20">
                                <Target className="h-6 w-6 text-blue-500" />
                              </div>
                              <CardTitle className="text-xl sm:text-2xl font-headline">
                                {selectedGoal.title}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge 
                                variant="secondary"
                                className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 text-base sm:text-lg px-3 sm:px-4 py-1"
                              >
                                {progressPercentage}%
                              </Badge>
                              {!isEditingGoalName ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditedGoalName(selectedGoal.title);
                                    setIsEditingGoalName(true);
                                  }}
                                  className="h-9"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 h-9"
                                    onClick={() => {
                                      if (confirm(`Delete goal "${selectedGoal.title}"?\n\nThis action cannot be undone. All steps and progress will be permanently lost.`)) {
                                        const updatedGoals = goals.filter(g => g.id !== selectedGoal.id);
                                        saveGoals(updatedGoals);
                                        setGoalsViewMode('list');
                                        setSelectedGoal(null);
                                        setIsEditingGoalName(false);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => setIsEditingGoalName(false)}
                                    className="h-9 bg-blue-500 hover:bg-blue-600"
                                  >
                                    Done
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-6">
                          <ScrollArea className="h-[500px] pr-4">
                            {/* Render based on goal type */}
                            {selectedGoal.goalType === 'milestone' ? (
                              // Milestone View - Large progress bars
                              <div className="space-y-6">
                                {allSteps.map((subGoal, index) => {
                                  const MilestoneItem = ({ subGoal, index }: { subGoal: SubGoal; index: number }) => {
                                    const [isEditing, setIsEditing] = React.useState(!subGoal.title);
                                    const [editTitle, setEditTitle] = React.useState(subGoal.title);
                                    const [editDescription, setEditDescription] = React.useState(subGoal.description || '');

                                    React.useEffect(() => {
                                      if (!subGoal.title) {
                                        setIsEditing(true);
                                      }
                                    }, [subGoal.title]);

                                    const handleSave = () => {
                                      if (editTitle.trim()) {
                                        const updatedSubGoals = selectedGoal.subGoals.map(sg =>
                                          sg.id === subGoal.id
                                            ? { ...sg, title: editTitle.trim(), description: editDescription.trim() || undefined }
                                            : sg
                                        );
                                        const updatedGoal = {
                                          ...selectedGoal,
                                          subGoals: updatedSubGoals,
                                          updatedAt: new Date().toISOString()
                                        };
                                        const updatedGoals = goals.map(g =>
                                          g.id === selectedGoal.id ? updatedGoal : g
                                        );
                                        setSelectedGoal(updatedGoal);
                                        saveGoals(updatedGoals);
                                        setIsEditing(false);
                                      }
                                    };

                                    const handleKeyDown = (e: React.KeyboardEvent) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSave();
                                      } else if (e.key === 'Escape') {
                                        if (!subGoal.title) {
                                          const updatedSubGoals = selectedGoal.subGoals.filter(sg => sg.id !== subGoal.id);
                                          const updatedGoal = {
                                            ...selectedGoal,
                                            subGoals: updatedSubGoals,
                                            updatedAt: new Date().toISOString()
                                          };
                                          const updatedGoals = goals.map(g =>
                                            g.id === selectedGoal.id ? updatedGoal : g
                                          );
                                          setSelectedGoal(updatedGoal);
                                          saveGoals(updatedGoals);
                                        } else {
                                          setIsEditing(false);
                                          setEditTitle(subGoal.title);
                                          setEditDescription(subGoal.description || '');
                                        }
                                      }
                                    };

                                    return (
                                      <div className="group relative">
                                        {/* Milestone Number Circle */}
                                        <div className="absolute left-0 sm:-left-2 top-2 sm:top-1/2 sm:-translate-y-1/2 z-10">
                                          <div className={cn(
                                            "w-7 h-7 sm:w-10 sm:h-10 rounded-full border-3 sm:border-4 flex items-center justify-center text-xs sm:text-sm font-bold transition-all",
                                            subGoal.completed
                                              ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-200 dark:border-green-700 text-white shadow-lg"
                                              : "bg-background border-border text-muted-foreground"
                                          )}>
                                            {subGoal.completed ? (
                                              <Check className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                                            ) : (
                                              <span>{index + 1}</span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Milestone Content Card */}
                                        <Card className={cn(
                                          "ml-9 sm:ml-12 mb-3 sm:mb-6 transition-all duration-300",
                                          subGoal.completed 
                                            ? "bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800" 
                                            : "hover:border-blue-300 dark:hover:border-blue-700"
                                        )}>
                                          <CardContent className="p-2 sm:p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                                              <div className="flex-1 min-w-0">
                                                {isEditing && isEditingGoalName ? (
                                                  <div className="space-y-2">
                                                    <Input
                                                      value={editTitle}
                                                      onChange={(e) => setEditTitle(e.target.value)}
                                                      onKeyDown={handleKeyDown}
                                                      placeholder="Enter milestone title..."
                                                      className="text-sm sm:text-base font-semibold h-8 sm:h-10"
                                                      autoFocus
                                                    />
                                                    <Input
                                                      value={editDescription}
                                                      onChange={(e) => setEditDescription(e.target.value)}
                                                      onKeyDown={handleKeyDown}
                                                      placeholder="Description (optional)..."
                                                      className="text-xs sm:text-sm h-7 sm:h-9"
                                                    />
                                                    <div className="flex gap-1.5 sm:gap-2">
                                                      <Button
                                                        size="sm"
                                                        onClick={handleSave}
                                                        disabled={!editTitle.trim()}
                                                        className="flex-1 sm:flex-none h-8 text-xs"
                                                      >
                                                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                                        Save
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                          if (!subGoal.title) {
                                                            const updatedSubGoals = selectedGoal.subGoals.filter(sg => sg.id !== subGoal.id);
                                                            const updatedGoal = {
                                                              ...selectedGoal,
                                                              subGoals: updatedSubGoals,
                                                              updatedAt: new Date().toISOString()
                                                            };
                                                            const updatedGoals = goals.map(g =>
                                                              g.id === selectedGoal.id ? updatedGoal : g
                                                            );
                                                            setSelectedGoal(updatedGoal);
                                                            saveGoals(updatedGoals);
                                                          } else {
                                                            setIsEditing(false);
                                                            setEditTitle(subGoal.title);
                                                            setEditDescription(subGoal.description || '');
                                                          }
                                                        }}
                                                        className="flex-1 sm:flex-none h-8 text-xs"
                                                      >
                                                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                                        Cancel
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <h3 
                                                      className={cn(
                                                        "text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1 cursor-pointer break-words leading-tight",
                                                        subGoal.completed && "text-muted-foreground/70"
                                                      )}
                                                      onClick={() => isEditingGoalName && setIsEditing(true)}
                                                    >
                                                      {subGoal.title || 'Untitled Milestone'}
                                                    </h3>
                                                    {subGoal.description && (
                                                      <p className={cn(
                                                        "text-xs sm:text-sm text-muted-foreground break-words leading-snug",
                                                        subGoal.completed && "opacity-70"
                                                      )}>
                                                        {subGoal.description}
                                                      </p>
                                                    )}
                                                    {subGoal.completedAt && (
                                                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 sm:mt-2 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                                        <span className="truncate">Completed {format(parseISO(subGoal.completedAt), 'MMM d, yyyy')}</span>
                                                      </p>
                                                    )}
                                                  </>
                                                )}
                                              </div>

                                              {/* Action Buttons */}
                                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                                                {/* Toggle Complete Button */}
                                                <Button
                                                  size="sm"
                                                  variant={subGoal.completed ? "default" : "outline"}
                                                  className={cn(
                                                    "h-8 sm:h-9 transition-all flex-1 sm:flex-none text-xs px-2 sm:px-3",
                                                    subGoal.completed 
                                                      ? "bg-green-500 hover:bg-green-600 text-white" 
                                                      : "hover:bg-blue-50 dark:hover:bg-blue-950"
                                                  )}
                                                  onClick={() => {
                                                    const updatedSubGoals = selectedGoal.subGoals.map(sg =>
                                                      sg.id === subGoal.id
                                                        ? { 
                                                            ...sg, 
                                                            completed: !sg.completed, 
                                                            completedAt: !sg.completed ? new Date().toISOString() : undefined 
                                                          }
                                                        : sg
                                                    );
                                                    const updatedGoal = { 
                                                      ...selectedGoal, 
                                                      subGoals: updatedSubGoals, 
                                                      updatedAt: new Date().toISOString() 
                                                    };
                                                    const updatedGoals = goals.map(g =>
                                                      g.id === selectedGoal.id ? updatedGoal : g
                                                    );
                                                    setSelectedGoal(updatedGoal);
                                                    saveGoals(updatedGoals);
                                                  }}
                                                >
                                                  {subGoal.completed ? (
                                                    <>
                                                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                      <span className="hidden sm:inline">Completed</span>
                                                      <span className="sm:hidden">Done</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Circle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                      <span className="hidden sm:inline">Mark Complete</span>
                                                      <span className="sm:hidden">Complete</span>
                                                    </>
                                                  )}
                                                </Button>

                                                {/* Edit & Delete - Only when editing */}
                                                {isEditingGoalName && !isEditing && (
                                                  <div className="flex gap-1 sm:gap-2">
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                      onClick={() => setIsEditing(true)}
                                                      title="Edit"
                                                    >
                                                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                                      onClick={() => {
                                                        if (confirm(`Delete milestone "${subGoal.title}"?`)) {
                                                          const updatedSubGoals = selectedGoal.subGoals
                                                            .filter(sg => sg.id !== subGoal.id)
                                                            .map((sg, idx) => ({ ...sg, order: idx }));
                                                          const updatedGoal = {
                                                            ...selectedGoal,
                                                            subGoals: updatedSubGoals,
                                                            updatedAt: new Date().toISOString()
                                                          };
                                                          const updatedGoals = goals.map(g =>
                                                            g.id === selectedGoal.id ? updatedGoal : g
                                                          );
                                                          setSelectedGoal(updatedGoal);
                                                          saveGoals(updatedGoals);
                                                        }
                                                      }}
                                                      title="Delete"
                                                    >
                                                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    );
                                  };

                                  return <MilestoneItem key={subGoal.id} subGoal={subGoal} index={index} />;
                                })}

                                {/* Add Milestone Button */}
                                {isEditingGoalName && (
                                  <div className="ml-9 sm:ml-12">
                                    <Button
                                      variant="outline"
                                      size="lg"
                                      className="w-full border-dashed border-2 h-12 sm:h-16 text-sm sm:text-base"
                                      onClick={() => {
                                        const newSubGoal: SubGoal = {
                                          id: `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                          title: '',
                                          description: '',
                                          completed: false,
                                          order: selectedGoal.subGoals.length,
                                        };
                                        const updatedGoal = {
                                          ...selectedGoal,
                                          subGoals: [...selectedGoal.subGoals, newSubGoal],
                                          updatedAt: new Date().toISOString()
                                        };
                                        const updatedGoals = goals.map(g =>
                                          g.id === selectedGoal.id ? updatedGoal : g
                                        );
                                        setSelectedGoal(updatedGoal);
                                        saveGoals(updatedGoals);
                                      }}
                                    >
                                      <Plus className="h-5 w-5 mr-2" />
                                      Add Milestone
                                    </Button>
                                  </div>
                                )}

                                {/* Completion Celebration */}
                                {completedCount === totalCount && totalCount > 0 && (
                                  <div className="text-center py-6 sm:py-12 px-3 sm:px-6 rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-2 border-green-300 dark:border-green-700 shadow-lg ml-9 sm:ml-12">
                                    <Trophy className="h-10 w-10 sm:h-16 sm:w-16 mx-auto mb-2 sm:mb-4 text-green-600 dark:text-green-400" />
                                    <h3 className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-300 mb-1 sm:mb-2">
                                      All Milestones Achieved! 🎉
                                    </h3>
                                    <p className="text-xs sm:text-base text-green-600/90 dark:text-green-400/90">
                                      You've reached every checkpoint. Incredible achievement!
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : selectedGoal.goalType === 'hierarchy' ? (
                              // Hierarchy View - Nested structure with modern styling
                              <div className="space-y-3">
                                {allSteps.filter(sg => !sg.parentId).map((subGoal) => (
                                  <HierarchySubGoalItem
                                    key={subGoal.id}
                                    subGoal={subGoal}
                                    allSubGoals={selectedGoal.subGoals}
                                    level={0}
                                    isEditMode={isEditingGoalName}
                                    onToggleComplete={(sgId) => {
                                      const updatedSubGoals = selectedGoal.subGoals.map(sg =>
                                        sg.id === sgId
                                          ? { 
                                              ...sg, 
                                              completed: !sg.completed, 
                                              completedAt: !sg.completed ? new Date().toISOString() : undefined 
                                            }
                                          : sg
                                      );
                                      const updatedGoal = { 
                                        ...selectedGoal, 
                                        subGoals: updatedSubGoals, 
                                        updatedAt: new Date().toISOString() 
                                      };
                                      const updatedGoals = goals.map(g =>
                                        g.id === selectedGoal.id ? updatedGoal : g
                                      );
                                      setSelectedGoal(updatedGoal);
                                      saveGoals(updatedGoals);
                                    }}
                                    onDelete={(sgId) => {
                                      if (confirm(`Delete this item and all its children?`)) {
                                        // Remove this subgoal and all its children
                                        const getAllChildIds = (parentId: string): string[] => {
                                          const children = selectedGoal.subGoals.filter(sg => sg.parentId === parentId);
                                          return [
                                            parentId,
                                            ...children.flatMap(child => getAllChildIds(child.id))
                                          ];
                                        };
                                        const idsToRemove = getAllChildIds(sgId);
                                        const updatedSubGoals = selectedGoal.subGoals
                                          .filter(sg => !idsToRemove.includes(sg.id))
                                          .map((sg, idx) => ({ ...sg, order: idx }));
                                        const updatedGoal = {
                                          ...selectedGoal,
                                          subGoals: updatedSubGoals,
                                          updatedAt: new Date().toISOString()
                                        };
                                        const updatedGoals = goals.map(g =>
                                          g.id === selectedGoal.id ? updatedGoal : g
                                        );
                                        setSelectedGoal(updatedGoal);
                                        saveGoals(updatedGoals);
                                      }
                                    }}
                                    onAddChild={(parentId) => {
                                      const newSubGoal: SubGoal = {
                                        id: `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                        title: '',
                                        description: '',
                                        completed: false,
                                        order: selectedGoal.subGoals.length,
                                        parentId: parentId,
                                        level: (selectedGoal.subGoals.find(sg => sg.id === parentId)?.level || 0) + 1,
                                        children: []
                                      };
                                      const updatedGoal = {
                                        ...selectedGoal,
                                        subGoals: [...selectedGoal.subGoals, newSubGoal],
                                        updatedAt: new Date().toISOString()
                                      };
                                      const updatedGoals = goals.map(g =>
                                        g.id === selectedGoal.id ? updatedGoal : g
                                      );
                                      setSelectedGoal(updatedGoal);
                                      saveGoals(updatedGoals);
                                    }}
                                    onUpdateText={(sgId, title, description) => {
                                      const updatedSubGoals = selectedGoal.subGoals.map(sg =>
                                        sg.id === sgId
                                          ? { ...sg, title, description }
                                          : sg
                                      );
                                      const updatedGoal = {
                                        ...selectedGoal,
                                        subGoals: updatedSubGoals,
                                        updatedAt: new Date().toISOString()
                                      };
                                      const updatedGoals = goals.map(g =>
                                        g.id === selectedGoal.id ? updatedGoal : g
                                      );
                                      setSelectedGoal(updatedGoal);
                                      saveGoals(updatedGoals);
                                    }}
                                  />
                                ))}
                              </div>
                            ) : (
                              // Step-by-step Timeline View
                              <div className="space-y-0">
                                {allSteps.map((subGoal, index) => (
                                  <StepByStepSubGoalItem
                                    key={subGoal.id}
                                    subGoal={subGoal}
                                    index={index}
                                    isLast={index === allSteps.length - 1}
                                    isEditMode={isEditingGoalName}
                                    onToggleComplete={(sgId) => {
                                      const updatedSubGoals = selectedGoal.subGoals.map(sg =>
                                        sg.id === sgId
                                          ? { 
                                              ...sg, 
                                              completed: !sg.completed, 
                                              completedAt: !sg.completed ? new Date().toISOString() : undefined 
                                            }
                                          : sg
                                      );
                                      const updatedGoal = { 
                                        ...selectedGoal, 
                                        subGoals: updatedSubGoals, 
                                        updatedAt: new Date().toISOString() 
                                      };
                                      const updatedGoals = goals.map(g =>
                                        g.id === selectedGoal.id ? updatedGoal : g
                                      );
                                      setSelectedGoal(updatedGoal);
                                      saveGoals(updatedGoals);
                                    }}
                                    onDelete={(sgId) => {
                                      if (!subGoal.title || confirm(`Delete step "${subGoal.title}"?`)) {
                                        const updatedSubGoals = selectedGoal.subGoals
                                          .filter(sg => sg.id !== sgId)
                                          .map((sg, idx) => ({ ...sg, order: idx }));
                                        const updatedGoal = {
                                          ...selectedGoal,
                                          subGoals: updatedSubGoals,
                                          updatedAt: new Date().toISOString()
                                        };
                                        const updatedGoals = goals.map(g =>
                                          g.id === selectedGoal.id ? updatedGoal : g
                                        );
                                        setSelectedGoal(updatedGoal);
                                        saveGoals(updatedGoals);
                                      }
                                    }}
                                    onUpdateText={(sgId, title, description) => {
                                      const updatedSubGoals = selectedGoal.subGoals.map(sg =>
                                        sg.id === sgId
                                          ? { ...sg, title, description }
                                          : sg
                                      );
                                      const updatedGoal = {
                                        ...selectedGoal,
                                        subGoals: updatedSubGoals,
                                        updatedAt: new Date().toISOString()
                                      };
                                      const updatedGoals = goals.map(g =>
                                        g.id === selectedGoal.id ? updatedGoal : g
                                      );
                                      setSelectedGoal(updatedGoal);
                                      saveGoals(updatedGoals);
                                    }}
                                  />
                                ))}
                              
                              {/* Add New Step Button - Only show when editing */}
                              {isEditingGoalName && (
                                <div className="flex items-start gap-4 pt-4">
                                  <div className="w-6 h-6 flex-shrink-0" /> {/* Spacer for alignment */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed"
                                    onClick={() => {
                                      const newSubGoal: SubGoal = {
                                        id: `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                        title: '',
                                        description: '',
                                        completed: false,
                                        order: selectedGoal.subGoals.length,
                                        level: 0
                                      };
                                      const updatedGoal = {
                                        ...selectedGoal,
                                        subGoals: [...selectedGoal.subGoals, newSubGoal],
                                        updatedAt: new Date().toISOString()
                                      };
                                      const updatedGoals = goals.map(g =>
                                        g.id === selectedGoal.id ? updatedGoal : g
                                      );
                                      setSelectedGoal(updatedGoal);
                                      saveGoals(updatedGoals);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Step
                                  </Button>
                                </div>
                              )}
                              
                              {/* Completion Celebration */}
                              {completedCount === totalCount && totalCount > 0 && (
                                <div className="text-center py-8 px-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800 mt-4">
                                  <Trophy className="h-12 w-12 mx-auto mb-3 text-green-600 dark:text-green-400" />
                                  <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">
                                    Goal Completed! 🎉
                                  </h3>
                                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                                    All steps finished. Amazing work!
                                  </p>
                                </div>
                              )}
                            </div>
                            )}
                            
                            {/* Add Top Level Item Button - Show for hierarchy when editing */}
                            {selectedGoal.goalType === 'hierarchy' && isEditingGoalName && (
                              <div className="pt-4">
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="w-full border-dashed border-2 h-14"
                                  onClick={() => {
                                    const newSubGoal: SubGoal = {
                                      id: `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                      title: '',
                                      description: '',
                                      completed: false,
                                      order: selectedGoal.subGoals.length,
                                      level: 0,
                                      children: []
                                    };
                                    const updatedGoal = {
                                      ...selectedGoal,
                                      subGoals: [...selectedGoal.subGoals, newSubGoal],
                                      updatedAt: new Date().toISOString()
                                    };
                                    const updatedGoals = goals.map(g =>
                                      g.id === selectedGoal.id ? updatedGoal : g
                                    );
                                    setSelectedGoal(updatedGoal);
                                    saveGoals(updatedGoals);
                                  }}
                                >
                                  <Plus className="h-5 w-5 mr-2" />
                                  Add Top Level Item
                                </Button>
                              </div>
                            )}

                            {/* Completion Celebration for Hierarchy */}
                            {selectedGoal.goalType === 'hierarchy' && completedCount === totalCount && totalCount > 0 && (
                              <div className="text-center py-10 px-6 rounded-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-2 border-green-300 dark:border-green-700 shadow-lg mt-6">
                                <Trophy className="h-14 w-14 mx-auto mb-4 text-green-600 dark:text-green-400" />
                                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">
                                  Goal Achieved! 🎉
                                </h3>
                                <p className="text-base text-green-600/90 dark:text-green-400/90">
                                  Every item completed. Outstanding achievement!
                                </p>
                              </div>
                            )}
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              )}
          </CardContent>
        </Card>

        <div className="space-y-6">
            <header className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div 
                    className="flex items-center gap-3 cursor-pointer group" 
                    onClick={() => setIsStreakBookCollapsed(!isStreakBookCollapsed)}
                >
                    <div className="p-2 rounded-lg bg-primary/20 group-hover:scale-110 transition-transform">
                        <BookOpenCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-headline">Habits</h2>
                        <p className="text-sm text-muted-foreground">
                            {isStreakBookCollapsed ? 'Click to expand' : 'Track daily habits and sprint challenges'}
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={() => setIsAddHabitDialogOpen(true)}
                    size="sm"
                    className="h-9 px-3 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
                >
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Add Habit</span>
                    <span className="sm:hidden">Add</span>
                </Button>
            </header>
            {!isStreakBookCollapsed && (
            <Accordion type="single" collapsible className="w-full space-y-4">
                {filteredHabits.map((habit) => {
                    if (!habit) return null;
                    const Icon = iconMap[habit.icon] || iconMap.CheckCircle2;
                    const streak = calculateStreak(
                        habit.completions,
                        1
                    );
                    
                    // Sprint habit calculations
                    const isSprint = habit.habitType === 'sprint';
                    let sprintDaysRemaining = 0;
                    let sprintProgress = 0;
                    if (isSprint && habit.sprintEndDate) {
                      const today = new Date();
                      const endDate = parseISO(habit.sprintEndDate);
                      sprintDaysRemaining = differenceInCalendarDays(endDate, today);
                      const totalDays = habit.sprintDuration || 1;
                      const daysPassed = totalDays - sprintDaysRemaining;
                      sprintProgress = Math.round((daysPassed / totalDays) * 100);
                    }
                    
                    return (
                        <Card key={habit.id} className="group relative overflow-hidden border-l-4 border-l-primary/20 hover:border-l-primary/60 transition-all duration-200 hover:shadow-md bg-gradient-to-r from-background via-background to-background/95">
                            <AccordionItem value={habit.id} className="border-b-0">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                <Icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-base">{habit.name}</span>
                                              {isSprint && (
                                                <Badge 
                                                  variant="secondary" 
                                                  className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 text-xs gap-1"
                                                >
                                                  <Zap className="h-3 w-3" />
                                                  {sprintDaysRemaining > 0 ? `${sprintDaysRemaining}d left` : 'Ended'}
                                                </Badge>
                                              )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                                                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 animate-pulse shrink-0" />
                                                <div className="flex items-center gap-1">
                                                    <span className="font-bold text-sm sm:text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                                        {streak}
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">
                                                        day{streak !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {/* Edit and Delete buttons in expanded mode */}
                                    <div className="flex items-center justify-end gap-2 px-4 pb-3 border-b mb-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setEditingHabit(habit);
                                                setIsEditHabitDialogOpen(true);
                                            }}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setHabitToDelete(habit);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                    <HabitGrid 
                                        habit={habit} 
                                        onToggle={handleToggleCompletion}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                    );
                })}
            </Accordion>
            )}
        </div>
      </div>
      <EditHabitDialog
        habit={editingHabit}
        isOpen={isEditHabitDialogOpen}
        onOpenChange={setIsEditHabitDialogOpen}
        onSave={handleSaveHabitName}
      />
      <AddHabitDialog
        isOpen={isAddHabitDialogOpen}
        onOpenChange={setIsAddHabitDialogOpen}
        onSave={handleAddHabit}
       />
       <AlertDialog open={!!habitToDelete} onOpenChange={() => setHabitToDelete(null)}>
            <AlertDialogContent className="border-destructive/20">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-destructive/10">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                        </div>
                        <AlertDialogTitle className="text-xl">Delete Habit</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base space-y-2">
                        <p>
                            Are you sure you want to permanently delete &quot;<strong className="text-foreground">{habitToDelete?.name}</strong>&quot;?
                        </p>
                        <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive font-medium">
                                ⚠️ This action cannot be undone
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                All streak data and completion history will be permanently lost.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel 
                        onClick={() => setHabitToDelete(null)}
                        className="hover:bg-accent"
                    >
                        Keep Habit
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDeleteHabit}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Forever
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
       </AlertDialog>

       {/* Add Step Dialog */}
       <Dialog open={isAddStepDialogOpen} onOpenChange={setIsAddStepDialogOpen}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Plus className="h-5 w-5 text-blue-500" />
               Add New Step
             </DialogTitle>
             <DialogDescription>
               Add a new step to your goal timeline
             </DialogDescription>
           </DialogHeader>

           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="step-title">Step Title *</Label>
               <Input
                 id="step-title"
                 placeholder="e.g., Research topic thoroughly"
                 value={newStepTitle}
                 onChange={(e) => setNewStepTitle(e.target.value)}
                 autoFocus
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="step-description">Description (Optional)</Label>
               <Input
                 id="step-description"
                 placeholder="Add details about this step..."
                 value={newStepDescription}
                 onChange={(e) => setNewStepDescription(e.target.value)}
               />
             </div>
           </div>

           <DialogFooter>
             <Button
               variant="outline"
               onClick={() => {
                 setIsAddStepDialogOpen(false);
                 setNewStepTitle('');
                 setNewStepDescription('');
               }}
             >
               Cancel
             </Button>
             <Button
               onClick={() => {
                 if (newStepTitle.trim() && selectedGoal) {
                   const newStep: SubGoal = {
                     id: `subgoal-${Date.now()}`,
                     title: newStepTitle.trim(),
                     description: newStepDescription.trim(),
                     completed: false,
                     order: selectedGoal.subGoals.length
                   };
                   const updatedGoal = {
                     ...selectedGoal,
                     subGoals: [...selectedGoal.subGoals, newStep],
                     updatedAt: new Date().toISOString()
                   };
                   const updatedGoals = goals.map(g =>
                     g.id === selectedGoal.id ? updatedGoal : g
                   );
                   setSelectedGoal(updatedGoal);
                   saveGoals(updatedGoals);
                   setIsAddStepDialogOpen(false);
                   setNewStepTitle('');
                   setNewStepDescription('');
                 }
               }}
               disabled={!newStepTitle.trim()}
               className="bg-blue-500 hover:bg-blue-600"
             >
               <Plus className="h-4 w-4 mr-2" />
               Add Step
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Add Goal Dialog */}
       <Dialog open={isAddGoalDialogOpen} onOpenChange={(open) => {
         setIsAddGoalDialogOpen(open);
         if (!open) {
           setNewGoalStep('type');
           setNewGoalType(null);
           setNewGoalTitle('');
           setNewGoalCategory('Other');
           setNewGoalMotive('');
           setNewGoalDescription('');
         }
       }}>
         <DialogContent className="max-w-2xl max-h-[60vh] overflow-y-auto sm:max-h-[90vh]">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
               <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
               Create New Goal
             </DialogTitle>
           </DialogHeader>

           {newGoalStep === 'type' && (
             <div className="space-y-3 py-2 sm:space-y-4 sm:py-4">
               <div className="grid gap-3 sm:gap-4">
                 {/* Step-by-Step Goal Type */}
                 <Card 
                   className={cn(
                     "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                     newGoalType === 'step-by-step' 
                       ? "border-blue-500 bg-blue-500/5" 
                       : "border-border hover:border-blue-300"
                   )}
                   onClick={() => setNewGoalType('step-by-step')}
                 >
                   <CardHeader className="p-3 sm:p-6">
                     <div className="flex items-start justify-between">
                       <div className="flex items-center gap-2 sm:gap-3">
                         <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20">
                           <ListOrdered className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                         </div>
                         <div>
                           <CardTitle className="text-base sm:text-lg">Step-by-Step Process</CardTitle>
                           <CardDescription className="mt-1 text-xs sm:text-sm">
                             Linear progression with ordered milestones
                           </CardDescription>
                         </div>
                       </div>
                       {newGoalType === 'step-by-step' && (
                         <CheckCircle2 className="h-6 w-6 text-blue-500" />
                       )}
                     </div>
                   </CardHeader>
                   <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                     <div className="space-y-2 sm:space-y-3">
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500" />
                         <span>Progress tracked with percentage circle</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500" />
                         <span>Sequential tasks that build on each other</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500" />
                         <span>Perfect for skill development & learning</span>
                       </div>
                       <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
                         <p className="text-xs text-muted-foreground">
                           <strong>Example:</strong> Learning a new language, Building a project, Training for a marathon
                         </p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>

                 {/* Hierarchy Goal Type */}
                 <Card 
                   className={cn(
                     "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                     newGoalType === 'hierarchy' 
                       ? "border-purple-500 bg-purple-500/5" 
                       : "border-border hover:border-purple-300"
                   )}
                   onClick={() => setNewGoalType('hierarchy')}
                 >
                   <CardHeader className="p-3 sm:p-6">
                     <div className="flex items-start justify-between">
                       <div className="flex items-center gap-2 sm:gap-3">
                         <div className="p-2 sm:p-3 rounded-lg bg-purple-500/20">
                           <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                         </div>
                         <div>
                           <CardTitle className="text-base sm:text-lg">Hierarchy: Low to Big</CardTitle>
                           <CardDescription className="mt-1 text-xs sm:text-sm">
                             Build up from small achievements to major milestones
                           </CardDescription>
                         </div>
                       </div>
                       {newGoalType === 'hierarchy' && (
                         <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                       )}
                     </div>
                   </CardHeader>
                   <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                     <div className="space-y-2 sm:space-y-3">
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-purple-500" />
                         <span>Tiered progression from beginner to advanced</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-purple-500" />
                         <span>Track status with color-coded levels</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-purple-500" />
                         <span>Perfect for career growth & financial goals</span>
                       </div>
                       <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
                         <p className="text-xs text-muted-foreground">
                           <strong>Example:</strong> Career advancement, Building wealth, Fitness levels (beginner → elite)
                         </p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>

                 {/* Milestone Goal Type */}
                 <Card 
                   className={cn(
                     "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                     newGoalType === 'milestone' 
                       ? "border-green-500 bg-green-500/5" 
                       : "border-border hover:border-green-300"
                   )}
                   onClick={() => setNewGoalType('milestone')}
                 >
                   <CardHeader className="p-3 sm:p-6">
                     <div className="flex items-start justify-between">
                       <div className="flex items-center gap-2 sm:gap-3">
                         <div className="p-2 sm:p-3 rounded-lg bg-green-500/20">
                           <Flag className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                         </div>
                         <div>
                           <CardTitle className="text-base sm:text-lg">Milestone Checkpoints</CardTitle>
                           <CardDescription className="mt-1 text-xs sm:text-sm">
                             Track major checkpoints in a long journey
                           </CardDescription>
                         </div>
                       </div>
                       {newGoalType === 'milestone' && (
                         <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                       )}
                     </div>
                   </CardHeader>
                   <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                     <div className="space-y-2 sm:space-y-3">
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
                         <span>Major checkpoints with clear completion status</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-2 w-2 rounded-full bg-green-500" />
                         <span>Sequential phases like semesters or quarters</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                         <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500" />
                         <span>Perfect for academic programs & multi-year projects</span>
                       </div>
                       <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
                         <p className="text-xs text-muted-foreground">
                           <strong>Example:</strong> B.Tech degree (8 semesters), Certification program, Book writing chapters
                         </p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </div>

               <DialogFooter>
                 <Button 
                   variant="outline" 
                   onClick={() => setIsAddGoalDialogOpen(false)}
                 >
                   Cancel
                 </Button>
                 <Button 
                   onClick={() => setNewGoalStep('details')}
                   disabled={!newGoalType}
                   className="bg-blue-500 hover:bg-blue-600"
                 >
                   Next: Add Details
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Button>
               </DialogFooter>
             </div>
           )}

           {newGoalStep === 'details' && (
             <div className="space-y-3 py-2 sm:space-y-4 sm:py-4">
               {/* Goal Type Badge */}
               <div className="flex items-center gap-2">
                 <Badge variant="secondary" className="gap-1">
                   {newGoalType === 'step-by-step' ? (
                     <>
                       <ListOrdered className="h-3 w-3" />
                       Step-by-Step Process
                     </>
                   ) : newGoalType === 'milestone' ? (
                     <>
                       <Flag className="h-3 w-3" />
                       Milestone Checkpoints
                     </>
                   ) : (
                     <>
                       <Layers className="h-3 w-3" />
                       Hierarchy Goal
                     </>
                   )}
                 </Badge>
                 <Button 
                   variant="ghost" 
                   size="sm"
                   onClick={() => setNewGoalStep('type')}
                   className="text-xs"
                 >
                   Change Type
                 </Button>
               </div>

               {/* Title */}
               <div className="space-y-2">
                 <Label htmlFor="goal-title" className="text-base font-semibold">
                   Goal Title *
                 </Label>
                 <Input
                   id="goal-title"
                   ref={goalTitleInputRef}
                   placeholder="e.g., Become a Senior Developer, Run a Marathon..."
                   value={newGoalTitle}
                   onChange={(e) => setNewGoalTitle(e.target.value)}
                   className="text-base"
                 />
               </div>

               {/* Category */}
               <div className="space-y-2">
                 <Label htmlFor="goal-category" className="text-base font-semibold">
                   Category
                 </Label>
                 <Select value={newGoalCategory} onValueChange={(v) => setNewGoalCategory(v as GoalCategory)}>
                   <SelectTrigger id="goal-category">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Career">🎯 Career</SelectItem>
                     <SelectItem value="Health & Fitness">💪 Health & Fitness</SelectItem>
                     <SelectItem value="Personal Development">🌱 Personal Development</SelectItem>
                     <SelectItem value="Education">📚 Education</SelectItem>
                     <SelectItem value="Finance">💰 Finance</SelectItem>
                     <SelectItem value="Relationships">❤️ Relationships</SelectItem>
                     <SelectItem value="Creativity">🎨 Creativity</SelectItem>
                     <SelectItem value="Lifestyle">🏡 Lifestyle</SelectItem>
                     <SelectItem value="Other">📌 Other</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               {/* Why This Matters */}
               <div className="space-y-2">
                 <Label htmlFor="goal-motive" className="text-base font-semibold flex items-center gap-2">
                   <Flame className="h-4 w-4 text-orange-500" />
                   Why This Matters to You
                 </Label>
                 <Input
                   id="goal-motive"
                   placeholder="What's your motivation? Why is this important?"
                   value={newGoalMotive}
                   onChange={(e) => setNewGoalMotive(e.target.value)}
                 />
                 <p className="text-xs text-muted-foreground">
                   This will keep you motivated when things get tough
                 </p>
               </div>

               {/* Description */}
               <div className="space-y-2">
                 <Label htmlFor="goal-description" className="text-base font-semibold">
                   Description (Optional)
                 </Label>
                 <Input
                   id="goal-description"
                   placeholder="Add more details about this goal..."
                   value={newGoalDescription}
                   onChange={(e) => setNewGoalDescription(e.target.value)}
                 />
               </div>

               {/* Info Box */}
               <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                 <div className="flex gap-3">
                   <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                   <div className="space-y-1">
                     <p className="text-sm font-medium">What happens next?</p>
                     <p className="text-xs text-muted-foreground">
                       After creating your goal, you'll be able to add milestones, track progress, 
                       attach resources, and link it to your daily habits for maximum impact.
                     </p>
                   </div>
                 </div>
               </div>

               <DialogFooter className="gap-2">
                 <Button 
                   variant="outline" 
                   onClick={() => setNewGoalStep('type')}
                 >
                   <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                   Back
                 </Button>
                 <Button 
                   onClick={handleCreateGoal}
                   disabled={!newGoalTitle.trim()}
                   className="bg-blue-500 hover:bg-blue-600"
                 >
                   <Target className="h-4 w-4 mr-2" />
                   Create Goal
                 </Button>
               </DialogFooter>
             </div>
           )}
         </DialogContent>
       </Dialog>
      </>
      )}
    </AppLayout>
  );
}

const availableIcons = [
  { name: 'CheckCircle2', label: 'Check Circle' },
  { name: 'Bed', label: 'Bed' },
  { name: 'Footprints', label: 'Activity' },
  { name: 'Sunrise', label: 'Sunrise' },
  { name: 'Guitar', label: 'Guitar' },
  { name: 'Code', label: 'Coding' },
  { name: 'Leaf', label: 'Nature' },
];

// Simple EditHabitDialog component for editing habit names
function EditHabitDialog({
  habit,
  isOpen,
  onOpenChange,
  onSave,
}: {
  habit: Habit | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (habitId: string, newName: string) => void;
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (habit) {
      setName(habit.name);
    }
  }, [habit]);

  const handleSave = () => {
    if (habit && name.trim()) {
      onSave(habit.id, name.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
          <DialogDescription>
            Update the name of your habit
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-habit-name">Habit Name</Label>
            <Input
              id="edit-habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Read for 15 minutes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Simple HabitGrid component to show habit completion calendar
function HabitGrid({
  habit,
  onToggle,
}: {
  habit: Habit;
  onToggle: (habitId: string, date: string) => void;
}) {
  const days = 30;
  const dates = Array.from({ length: days }, (_, i) => {
    const d = subDays(new Date(), days - 1 - i);
    return format(d, 'yyyy-MM-dd');
  });

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-10 gap-2">
        {dates.map((date) => {
          const isCompleted = !!habit.completions[date];
          const isToday = isSameDay(parseISO(date), new Date());
          
          return (
            <button
              key={date}
              onClick={() => onToggle(habit.id, date)}
              disabled={!isToday}
              className={cn(
                "h-8 w-8 rounded-md border-2 transition-all",
                isCompleted 
                  ? "bg-green-500 border-green-600 hover:bg-green-600" 
                  : "border-border hover:border-primary",
                isToday && "ring-2 ring-primary ring-offset-2",
                !isToday && "opacity-60 cursor-not-allowed"
              )}
              title={format(parseISO(date), 'MMM d, yyyy')}
            >
              {isCompleted && <Check className="h-4 w-4 text-white mx-auto" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddHabitDialog({
  isOpen,
  onOpenChange,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, icon: string, habitType?: 'repetitive' | 'sprint', sprintDuration?: number, sprintEndDate?: string) => void;
}) {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState(availableIcons[0].name);
    const [habitType, setHabitType] = useState<'repetitive' | 'sprint'>('repetitive');
    const [sprintType, setSprintType] = useState<'duration' | 'endDate'>('duration');
    const [sprintDuration, setSprintDuration] = useState('30');
    const [sprintEndDate, setSprintEndDate] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            return;
        }
        
        if (habitType === 'sprint') {
            if (sprintType === 'duration') {
                const duration = parseInt(sprintDuration);
                if (duration > 0) {
                    onSave(name, icon, habitType, duration, undefined);
                }
            } else {
                if (sprintEndDate) {
                    onSave(name, icon, habitType, undefined, sprintEndDate);
                }
            }
        } else {
            onSave(name, icon, habitType);
        }
        
        onOpenChange(false);
        setName('');
        setIcon(availableIcons[0].name);
        setHabitType('repetitive');
        setSprintType('duration');
        setSprintDuration('30');
        setSprintEndDate('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setName('');
                setIcon(availableIcons[0].name);
                setHabitType('repetitive');
                setSprintType('duration');
                setSprintDuration('30');
                setSprintEndDate('');
            }
            onOpenChange(open);
        }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create a New Habit</DialogTitle>
                    <DialogDescription>
                        Create a daily habit or a time-limited sprint challenge.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-habit-name">Habit Name</Label>
                        <Input
                            id="new-habit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Read for 15 minutes"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-habit-icon">Icon</Label>
                        <Select value={icon} onValueChange={setIcon}>
                            <SelectTrigger id="new-habit-icon">
                                <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableIcons.map(iconInfo => {
                                    const IconComponent = iconMap[iconInfo.name];
                                    if (!IconComponent) return null;
                                    return (
                                        <SelectItem key={iconInfo.name} value={iconInfo.name}>
                                            <div className="flex items-center gap-2">
                                                <IconComponent className="h-4 w-4" />
                                                <span>{iconInfo.label}</span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Habit Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Card 
                              className={cn(
                                "cursor-pointer transition-all border-2",
                                habitType === 'repetitive' 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-primary/50"
                              )}
                              onClick={() => setHabitType('repetitive')}
                            >
                              <CardContent className="p-4 text-center">
                                <Flame className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="font-semibold text-sm">Repetitive</p>
                                <p className="text-xs text-muted-foreground mt-1">Ongoing habit</p>
                              </CardContent>
                            </Card>
                            <Card 
                              className={cn(
                                "cursor-pointer transition-all border-2",
                                habitType === 'sprint' 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-primary/50"
                              )}
                              onClick={() => setHabitType('sprint')}
                            >
                              <CardContent className="p-4 text-center">
                                <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
                                <p className="font-semibold text-sm">Sprint</p>
                                <p className="text-xs text-muted-foreground mt-1">Time-limited</p>
                              </CardContent>
                            </Card>
                        </div>
                    </div>
                    
                    {habitType === 'sprint' && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
                        <Label className="text-sm font-semibold">Sprint Challenge Settings</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant={sprintType === 'duration' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSprintType('duration')}
                            className="text-xs"
                          >
                            Duration
                          </Button>
                          <Button
                            type="button"
                            variant={sprintType === 'endDate' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSprintType('endDate')}
                            className="text-xs"
                          >
                            End Date
                          </Button>
                        </div>
                        
                        {sprintType === 'duration' && (
                          <div className="space-y-2">
                            <Label htmlFor="sprint-duration" className="text-sm">Number of Days</Label>
                            <Input
                              id="sprint-duration"
                              type="number"
                              min="1"
                              max="365"
                              value={sprintDuration}
                              onChange={(e) => setSprintDuration(e.target.value)}
                              placeholder="30"
                            />
                            <p className="text-xs text-muted-foreground">
                              Challenge yourself for {sprintDuration || '30'} days
                            </p>
                          </div>
                        )}
                        
                        {sprintType === 'endDate' && (
                          <div className="space-y-2">
                            <Label htmlFor="sprint-end-date" className="text-sm">End Date</Label>
                            <Input
                              id="sprint-end-date"
                              type="date"
                              value={sprintEndDate}
                              onChange={(e) => setSprintEndDate(e.target.value)}
                              min={format(new Date(), 'yyyy-MM-dd')}
                            />
                            <p className="text-xs text-muted-foreground">
                              Sprint will end on this date
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>
                      {habitType === 'sprint' ? 'Start Challenge' : 'Create Habit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
