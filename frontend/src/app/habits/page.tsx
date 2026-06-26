
'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Habit } from '@/types';
import { useHabits } from '@/hooks/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    PlusCircle, Flame, List, CalendarDays, Edit, Apple, Settings, Trash2, Check, 
    AlertTriangle, Droplets, Plus, Minus, BookOpenCheck, Bed, Footprints, 
  Sunrise, Guitar, Code, Leaf, CheckCircle2, GlassWater, TrendingUp, Zap
} from 'lucide-react';
import { subDays, format, isSameDay, parseISO, differenceInCalendarDays } from 'date-fns';
import { calculateStreak, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const iconMap: Record<string, React.ElementType> = {
    PlusCircle, Flame, List, CalendarDays, Edit, Apple, Settings, Trash2, Check, 
    AlertTriangle, Droplets, Plus, Minus, BookOpenCheck, Bed, Footprints, 
    Sunrise, Guitar, Code, Leaf, CheckCircle2, GlassWater, TrendingUp
};

export default function HabitsPage() {
  const {
    habits,
    isLoading: habitsLoading,
    addHabit: addHabitApi,
    updateHabit: updateHabitApi,
    deleteHabit: deleteHabitApi,
  } = useHabits();
  const isLoading = habitsLoading;

  // Core State
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isEditHabitDialogOpen, setIsEditHabitDialogOpen] = useState(false);
  const [isAddHabitDialogOpen, setIsAddHabitDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  // Collapse states - all collapsed by default
  const [isStreakBookCollapsed, setIsStreakBookCollapsed] = useState(true);

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
        <header className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setIsStreakBookCollapsed(!isStreakBookCollapsed)}
          >
            <div className="p-2 rounded-lg bg-primary/20 group-hover:scale-110 transition-transform">
              <BookOpenCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Streaks & habits</p>
              <p className="text-xs text-muted-foreground">
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
              if (isSprint && habit.sprintEndDate) {
                const today = new Date();
                const endDate = parseISO(habit.sprintEndDate);
                sprintDaysRemaining = differenceInCalendarDays(endDate, today);
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
