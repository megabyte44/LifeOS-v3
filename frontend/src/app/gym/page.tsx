'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Habit, Exercise, CyclicalWorkoutSplit, CycleConfig, ProteinIntake, LoggedFoodItem, ExerciseSession } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Dumbbell, CalendarDays, Beef, Apple, Settings, Trash2, Check, 
    Plus, Minus, Pill, CheckCircle2, TrendingUp, BarChart2, Zap, Target, Clock,
    Trophy, Award, TrendingDown, Activity, Calendar as CalendarIcon, X, Info, PlusCircle, Edit
} from 'lucide-react';
import { subDays, format, isSameDay, parseISO, differenceInCalendarDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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

// Copy all the gym-related helper functions, components, and constants from habits page:
// - augmentWorkoutSplit
// - initialWorkoutSplitRaw, initialWorkoutSplit, initialCustomFoodItems
// - useWorkoutDayInfo hook
// - GymTracker component
// - ProteinTrackerCard component
// - FoodLogCard component
// - OverloadSetup component
// - GymSettingsDialog component
// - FoodManagerDialog component
// - OverloadTrackerDialog component
// --- Augment initial data with IDs and overload properties ---

// --- Initial Data for Gym Tracker ---
const initialWorkoutSplitRaw: CyclicalWorkoutSplit = {
  "Day 1": { title: "Push Day (Chest, Shoulders, Triceps)", exercises: [{ id: 'ex-1', name: "Bench Press", sets: "3-4" }, { id: 'ex-2', name: "Overhead Press", sets: "3" }, { id: 'ex-3', name: "Incline Dumbbell Press", sets: "3" }, { id: 'ex-4', name: "Tricep Dips/Pushdowns", sets: "3" }, { id: 'ex-5', name: "Lateral Raises", sets: "3" }] },
  "Day 2": { title: "Pull Day (Back, Biceps)", exercises: [{ id: 'ex-6', name: "Pull-ups/Lat Pulldowns", sets: "3-4" }, { id: 'ex-7', name: "Bent-over Rows", sets: "3" }, { id: 'ex-8', name: "Seated Cable Rows", sets: "3" }, { id: 'ex-9', name: "Barbell Curls", sets: "3" }, { id: 'ex-10', name: "Face Pulls", sets: "3" }] },
  "Day 3": { title: "Leg Day (Quads, Hamstrings, Calves)", exercises: [{ id: 'ex-11', name: "Squats", sets: "3-4" }, { id: 'ex-12', name: "Romanian Deadlifts", sets: "3" }, { id: 'ex-13', name: "Leg Press", sets: "3" }, { id: 'ex-14', name: "Leg Curls", sets: "3" }, { id: 'ex-15', name: "Calf Raises", sets: "3" }] },
  "Day 4": { title: "Rest Day", exercises: [] },
};
const augmentWorkoutSplit = (split: CyclicalWorkoutSplit): CyclicalWorkoutSplit => {
    if (!split) return {};
    const newSplit: CyclicalWorkoutSplit = {};
    Object.entries(split).forEach(([dayKey, dayData]) => {
        newSplit[dayKey] = {
            ...dayData,
            exercises: dayData.exercises.map(ex => ({
                id: ex.id || crypto.randomUUID(),
                name: ex.name,
                sets: ex.sets,
                kValue: ex.kValue ?? 0.5,
                baselineWeight: ex.baselineWeight ?? 0,
                baselineReps: ex.baselineReps ?? 0,
                targetWeight: ex.targetWeight ?? 0,
                targetReps: ex.targetReps ?? 0,
                sessionHistory: ex.sessionHistory || [],
            }))
        };
    });
    return newSplit;
};
const initialWorkoutSplit = augmentWorkoutSplit(initialWorkoutSplitRaw);
const initialCustomFoodItems = ["Protein Powder", "Creatine", "Oatmeal", "Eggs", "Chicken Breast", "Greek Yogurt"];

const useWorkoutDayInfo = (cyclicalWorkoutSplit: CyclicalWorkoutSplit, cycleConfig: CycleConfig) => {
    return useCallback((date: Date) => {
        const cycleWorkoutKeys = Object.keys(cyclicalWorkoutSplit).sort((a, b) => {
            const numA = parseInt(a.split(' ')[1], 10);
            const numB = parseInt(b.split(' ')[1], 10);
            if (isNaN(numA) || isNaN(numB)) {
                return a.localeCompare(b);
            }
            return numA - numB;
        });
        const cycleLength = cycleWorkoutKeys.length;
        if (!cycleConfig.startDate || !cycleConfig.startDayKey || cycleLength === 0) {
            return { key: "N/A", title: "Cycle Not Configured", exercises: [], isRestDay: false };
        }
        
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedStartDate = new Date(parseISO(cycleConfig.startDate));
        
        const daysSinceStart = differenceInCalendarDays(normalizedDate, normalizedStartDate);

        if (daysSinceStart < 0) {
            return { key: "N/A", title: "Cycle Starts in Future", exercises: [], isRestDay: true };
        }

        let startIndexInCycle = cycleWorkoutKeys.indexOf(cycleConfig.startDayKey);
        if (startIndexInCycle === -1) {
             startIndexInCycle = 0;
        }
        const currentDayIndexInCycle = (startIndexInCycle + daysSinceStart) % cycleLength;
        const workoutKey = cycleWorkoutKeys[currentDayIndexInCycle];
        const workoutData = cyclicalWorkoutSplit[workoutKey] || { title: "Undefined Workout", exercises: [] };
        const isRestDay = workoutData.exercises.length === 0;

        return { key: workoutKey, ...workoutData, isRestDay };
    }, [cyclicalWorkoutSplit, cycleConfig]);
};

type GymTrackerProps = {
  proteinIntakes: ProteinIntake[];
  onProteinIntakesChange: (intakes: ProteinIntake[]) => void;
  loggedFoodItems: LoggedFoodItem[];
  onLoggedFoodItemsChange: (items: LoggedFoodItem[]) => void;
  proteinTarget: number;
  onProteinTargetChange: (target: number) => void;
  customFoodItems: string[];
  onManageCustomFoodItems: () => void;
  onManagePlan: () => void;
  onToggleWorkoutCompletion: () => void;
  isTodayCompleted: boolean;
  todaysWorkoutInfo: ReturnType<ReturnType<typeof useWorkoutDayInfo>>;
  onOpenOverloadTracker: () => void;
  cyclicalWorkoutSplit: CyclicalWorkoutSplit;
  onWorkoutSplitChange: (split: CyclicalWorkoutSplit) => void;
  preferences: {
    overloadTracker: boolean;
    gymProteinIntake: boolean;
    gymFoodSupplements: boolean;
  };
};

function GymTracker({ 
    proteinIntakes, onProteinIntakesChange,
    loggedFoodItems, onLoggedFoodItemsChange,
    proteinTarget, onProteinTargetChange,
    customFoodItems,
    onManageCustomFoodItems,
    onManagePlan,
    onToggleWorkoutCompletion,
    isTodayCompleted,
    todaysWorkoutInfo,
    onOpenOverloadTracker,
    cyclicalWorkoutSplit,
    onWorkoutSplitChange,
    preferences,
}: GymTrackerProps) {
    
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm">
                        <Dumbbell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-headline bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Gym Tracker
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Track your fitness journey
                        </p>
                    </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl hover:bg-purple-500/10 hover:text-purple-600 transition-all duration-200" 
                    onClick={onManagePlan}
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Today's Workout Card */}
                <Card className={cn(
                    "lg:col-span-3 relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-xl",
                    isTodayCompleted 
                        ? "border-l-green-500 bg-gradient-to-br from-background via-background to-green-500/5 hover:border-l-green-600" 
                        : "border-l-blue-500 bg-gradient-to-br from-background via-background to-blue-500/5 hover:border-l-blue-600"
                )}>
                    <div className={cn(
                        "absolute top-0 right-0 w-32 h-32 rounded-bl-full pointer-events-none",
                        isTodayCompleted 
                            ? "bg-gradient-to-bl from-green-500/10 to-transparent" 
                            : "bg-gradient-to-bl from-blue-500/10 to-transparent"
                    )} />
                    
                    <CardHeader className="p-4 relative">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="font-headline flex items-center gap-2 text-lg">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        isTodayCompleted 
                                            ? "bg-green-500/20" 
                                            : "bg-blue-500/20"
                                    )}>
                                        <CalendarDays className={cn(
                                            "h-4 w-4",
                                            isTodayCompleted ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                                        )} />
                                    </div>
                                    <span>{todaysWorkoutInfo.key}: {todaysWorkoutInfo.title}</span>
                                </CardTitle>
                                <CardDescription className="text-sm flex items-center gap-2">
                                    <span>Today's Plan</span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="font-medium">{format(new Date(), 'MMM d')}</span>
                                </CardDescription>
                            </div>
                            {isTodayCompleted && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">Completed</span>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-0">
                        {todaysWorkoutInfo.exercises.length > 0 ? (
                            <div className="space-y-2">
                                {todaysWorkoutInfo.exercises.map((ex: Exercise, i: number) => (
                                    <div 
                                        key={ex.id || i} 
                                        className={cn(
                                            "group flex justify-between items-center p-3 rounded-xl border transition-all duration-200",
                                            isTodayCompleted
                                                ? "bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-800"
                                                : "bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-800",
                                            "hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm",
                                                isTodayCompleted
                                                    ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                                                    : "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                            )}>
                                                {i + 1}
                                            </div>
                                            <span className="font-semibold text-sm">{ex.name}</span>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-1 rounded-lg",
                                            isTodayCompleted
                                                ? "bg-green-100 dark:bg-green-900/50"
                                                : "bg-blue-100 dark:bg-blue-900/50"
                                        )}>
                                            <Dumbbell className={cn(
                                                "h-3.5 w-3.5",
                                                isTodayCompleted ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                                            )} />
                                            <span className={cn(
                                                "text-xs font-semibold",
                                                isTodayCompleted ? "text-green-700 dark:text-green-300" : "text-blue-700 dark:text-blue-300"
                                            )}>
                                                {ex.sets} sets
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="font-medium">{todaysWorkoutInfo.title}</p>
                            </div>
                        )}
                    </CardContent>
                    
                    {!todaysWorkoutInfo.isRestDay && (
                        <CardFooter className="p-4 pt-0">
                            <Button 
                                size="lg" 
                                className={cn(
                                    "w-full h-12 font-semibold text-sm transition-all duration-300 shadow-lg",
                                    isTodayCompleted
                                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl"
                                        : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:shadow-xl"
                                )}
                                onClick={onToggleWorkoutCompletion}
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5"/>
                                {isTodayCompleted ? 'Workout Completed! 💪' : "Mark Today's Workout as Done"}
                            </Button>
                        </CardFooter>
                    )}
                </Card>

                {/* Progressive Overload Card */}
                {preferences.overloadTracker && todaysWorkoutInfo.exercises.length > 0 && (
                <Card className="lg:col-span-3 relative overflow-hidden border-l-4 border-l-purple-500/50 hover:border-l-purple-500 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background via-background to-purple-500/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    
                    <CardHeader className="p-4 pb-3 relative">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="font-headline flex items-center gap-2 text-lg">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span>Progressive Overload</span>
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Log your sets for today's exercises
                                </CardDescription>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="h-9 px-4 border-purple-200 dark:border-purple-900/50 hover:bg-purple-500/10 hover:text-purple-600 transition-colors" 
                                onClick={onOpenOverloadTracker}
                            >
                                <BarChart2 className="mr-2 h-4 w-4" />
                                View Analytics
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-4 pt-0 space-y-3">
                        {todaysWorkoutInfo.exercises.map((exercise: Exercise, idx: number) => (
                            <ProgressiveOverloadExerciseCard
                                key={exercise.id || idx}
                                exercise={exercise}
                                workoutSplit={cyclicalWorkoutSplit}
                                onWorkoutSplitChange={onWorkoutSplitChange}
                            />
                        ))}
                    </CardContent>
                </Card>
                )}
            </div>
        </div>
    )
}

function ProgressiveOverloadExerciseCard({
    exercise,
    workoutSplit,
    onWorkoutSplitChange
}: {
    exercise: Exercise;
    workoutSplit: CyclicalWorkoutSplit;
    onWorkoutSplitChange: (split: CyclicalWorkoutSplit) => void;
}) {
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [isLogging, setIsLogging] = useState(false);

    const lastSession = exercise.sessionHistory?.[0]; // Most recent session
    const previousBest = useMemo(() => {
        if (!exercise.sessionHistory || exercise.sessionHistory.length === 0) return null;
        return exercise.sessionHistory.reduce((best, session) => {
            const currentE1RM = session.weight * (1 + session.reps / 30);
            const bestE1RM = best.weight * (1 + best.reps / 30);
            return currentE1RM > bestE1RM ? session : best;
        });
    }, [exercise.sessionHistory]);

    const handleLogSet = () => {
        const weightNum = parseFloat(weight);
        const repsNum = parseInt(reps);
        
        if (isNaN(weightNum) || isNaN(repsNum) || weightNum <= 0 || repsNum <= 0) {
            return;
        }

        setIsLogging(true);

        const newSession: ExerciseSession = {
            weight: weightNum,
            reps: repsNum,
            date: format(new Date(), 'yyyy-MM-dd')
        };

        const newSplit = JSON.parse(JSON.stringify(workoutSplit));
        
        // Find and update the exercise
        for (const dayKey in newSplit) {
            const day = newSplit[dayKey];
            const exIndex = day.exercises.findIndex((ex: Exercise) => ex.id === exercise.id);
            if (exIndex !== -1) {
                if (!day.exercises[exIndex].sessionHistory) {
                    day.exercises[exIndex].sessionHistory = [];
                }
                day.exercises[exIndex].sessionHistory.unshift(newSession); // Add to beginning
                break;
            }
        }

        onWorkoutSplitChange(newSplit);
        setWeight('');
        setReps('');
        setTimeout(() => setIsLogging(false), 500);
    };

    const calculateE1RM = (w: number, r: number) => w * (1 + r / 30);
    const currentE1RM = weight && reps ? calculateE1RM(parseFloat(weight), parseInt(reps)) : 0;
    const isNewPR = previousBest && currentE1RM > calculateE1RM(previousBest.weight, previousBest.reps);

    return (
        <div className="group p-4 rounded-xl border bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-800 transition-all duration-200 hover:shadow-md">
            <div className="space-y-3">
                {/* Exercise Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-semibold text-base text-purple-900 dark:text-purple-100">{exercise.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{exercise.sets} sets</p>
                    </div>
                    {lastSession && (
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Last session</p>
                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                {lastSession.weight}kg × {lastSession.reps}
                            </p>
                        </div>
                    )}
                </div>

                {/* Input Section */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                        <Label htmlFor={`weight-${exercise.id}`} className="text-xs font-medium text-muted-foreground">
                            Weight (kg)
                        </Label>
                        <div className="relative">
                            <Input
                                id={`weight-${exercise.id}`}
                                type="number"
                                placeholder="0"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="h-10 text-sm pr-8 border-purple-200 dark:border-purple-900/50 focus-visible:ring-purple-500/50"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor={`reps-${exercise.id}`} className="text-xs font-medium text-muted-foreground">
                            Reps
                        </Label>
                        <div className="relative">
                            <Input
                                id={`reps-${exercise.id}`}
                                type="number"
                                placeholder="0"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogSet()}
                                className="h-10 text-sm pr-8 border-purple-200 dark:border-purple-900/50 focus-visible:ring-purple-500/50"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                        </div>
                    </div>
                </div>

                {/* E1RM Preview & Log Button */}
                <div className="flex items-center gap-2">
                    {weight && reps && (
                        <div className={cn(
                            "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                            isNewPR 
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800"
                                : "bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        )}>
                            <span className="opacity-75">Est. 1RM: </span>
                            <span className="font-bold">{currentE1RM.toFixed(1)}kg</span>
                            {isNewPR && <span className="ml-2">🎉 New PR!</span>}
                        </div>
                    )}
                    <Button
                        onClick={handleLogSet}
                        size="sm"
                        disabled={!weight || !reps}
                        className={cn(
                            "h-10 px-5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50",
                            isLogging && "scale-95"
                        )}
                    >
                        <PlusCircle className={cn("h-4 w-4 mr-2 transition-transform", isLogging && "rotate-90")} />
                        Log Set
                    </Button>
                </div>

                {/* Personal Best */}
                {previousBest && (
                    <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/30">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                                <Trophy className="h-3 w-3 text-amber-500" />
                                Personal Best
                            </span>
                            <span className="font-semibold text-purple-700 dark:text-purple-300">
                                {previousBest.weight}kg × {previousBest.reps} 
                                <span className="ml-1.5 text-muted-foreground">
                                    ({calculateE1RM(previousBest.weight, previousBest.reps).toFixed(1)}kg)
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProteinTrackerCard({ intakes, onIntakesChange, target, onTargetChange }: {
    intakes: ProteinIntake[],
    onIntakesChange: (intakes: ProteinIntake[]) => void,
    target: number,
    onTargetChange: (target: number) => void
}) {
    const [amount, setAmount] = useState('');
    const [isLogging, setIsLogging] = useState(false);
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    const todaysIntakes = useMemo(() => {
        return intakes.filter((intake: ProteinIntake) => format(parseISO(intake.timestamp), 'yyyy-MM-dd') === todayKey);
    }, [intakes, todayKey]);

    const totalProtein = useMemo(() => todaysIntakes.reduce((sum: number, intake: ProteinIntake) => sum + intake.amount, 0), [todaysIntakes]);
    const progress = useMemo(() => (target > 0 ? Math.min(100, (totalProtein / target) * 100) : 0), [totalProtein, target]);

    const handleLogProtein = () => {
        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return;
        }
        setIsLogging(true);
        const newIntake: ProteinIntake = { id: `p-${Date.now()}`, amount: numAmount, timestamp: new Date().toISOString() };
        onIntakesChange([...intakes, newIntake]);
        setAmount('');
        setTimeout(() => setIsLogging(false), 500);
    };

    const handleDelete = (id: string) => {
        onIntakesChange(intakes.filter((i: ProteinIntake) => i.id !== id));
    };

    const progressColor = progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : progress >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : progress >= 50 ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gradient-to-r from-red-500 to-pink-600';

    return (
        <Card className="relative overflow-hidden border-l-4 border-l-red-500/50 hover:border-l-red-500 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background via-background to-red-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full pointer-events-none" />
            
            <CardHeader className="p-4 pb-3 relative">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="font-headline flex items-center gap-2 text-lg">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm">
                                <Beef className="h-5 w-5 text-red-500" />
                            </div>
                            <span>Protein Intake</span>
                        </CardTitle>
                        <CardDescription className="text-sm flex items-center gap-2">
                            <span className="font-semibold text-foreground">{totalProtein}g</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{target}g</span>
                        </CardDescription>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                        <div className={cn(
                            "text-2xl font-bold tabular-nums transition-colors",
                            progress >= 100 ? "text-green-500" : progress >= 75 ? "text-blue-500" : progress >= 50 ? "text-orange-500" : "text-red-500"
                        )}>
                            {Math.round(progress)}%
                        </div>
                        <div className="text-xs text-muted-foreground">{todaysIntakes.length} logs</div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4 p-4 pt-0 relative">
                {/* Animated Progress Bar */}
                <div className="space-y-2">
                    <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm border border-border/50">
                        <div 
                            className={cn(
                                "h-full transition-all duration-500 ease-out relative overflow-hidden",
                                progressColor
                            )}
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </div>
                    </div>
                </div>

                {/* Target Setting */}
                <div className="space-y-2">
                    <Label htmlFor="proteinTarget" className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-500" />
                        Daily Target (g)
                    </Label>
                    <Input 
                        id="proteinTarget" 
                        type="number" 
                        value={target} 
                        onChange={e => onTargetChange(Number(e.target.value))} 
                        placeholder="e.g., 150" 
                        className="h-10 text-sm border-red-200 dark:border-red-900/50 focus-visible:ring-red-500/50"
                    />
                </div>

                {/* Log Protein Input */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input 
                            type="number" 
                            placeholder="Add protein (g)" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleLogProtein()} 
                            className="h-11 text-sm pl-10 pr-4 border-red-200 dark:border-red-900/50 focus-visible:ring-red-500/50"
                        />
                        <Beef className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <Button 
                        onClick={handleLogProtein} 
                        size="lg"
                        className={cn(
                            "h-11 px-5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl",
                            isLogging && "scale-95"
                        )}
                    >
                        <PlusCircle className={cn("h-5 w-5 transition-transform", isLogging && "rotate-90")} />
                    </Button>
                </div>

                <Separator />

                {/* Today's Logs */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Today's Logs
                    </h4>
                    <ScrollArea className="max-h-40">
                        <div className="space-y-2 pr-2">
                            {todaysIntakes.length > 0 ? [...todaysIntakes].reverse().map((intake: ProteinIntake) => (
                                <div 
                                    key={intake.id} 
                                    className="group flex justify-between items-center text-sm bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-950/30 dark:to-pink-950/30 p-3 rounded-xl border border-red-200/50 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-800 transition-all duration-200 hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50">
                                            <Beef className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-red-700 dark:text-red-300">{intake.amount}g</p>
                                            <p className="text-xs text-muted-foreground">{format(parseISO(intake.timestamp), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-all duration-200"
                                        onClick={() => handleDelete(intake.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    <Beef className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No protein logged yet today</p>
                                    <p className="text-xs mt-1">Start tracking your intake above</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
function FoodLogCard({ loggedItems, onLoggedItemsChange, customItems, onManageItems }: {
    loggedItems: LoggedFoodItem[],
    onLoggedItemsChange: (items: LoggedFoodItem[]) => void,
    customItems: string[],
    onManageItems: () => void
}) {
    const [flashingItem, setFlashingItem] = useState<string | null>(null);
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    const handleLogItem = (name: string) => {
        const newItem: LoggedFoodItem = { id: `f-${Date.now()}`, name, timestamp: new Date().toISOString() };
        onLoggedItemsChange([...loggedItems, newItem]);
        
        // Flash animation
        setFlashingItem(name);
        setTimeout(() => setFlashingItem(null), 600);
    };
    
    const handleDelete = (id: string) => {
        onLoggedItemsChange(loggedItems.filter((i: LoggedFoodItem) => i.id !== id));
    };

    const todaysLoggedItems = loggedItems.filter((i: LoggedFoodItem) => format(parseISO(i.timestamp), 'yyyy-MM-dd') === todayKey);

    return (
        <Card className="relative overflow-hidden border-l-4 border-l-green-500/50 hover:border-l-green-500 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background via-background to-green-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full pointer-events-none" />
            
            <CardHeader className="flex flex-row justify-between items-start p-4 relative">
                <div className="space-y-1">
                    <CardTitle className="font-headline flex items-center gap-2 text-lg">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
                            <Pill className="h-5 w-5 text-green-500" />
                        </div>
                        <span>Food & Supplements</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                        Quick log • {todaysLoggedItems.length} items today
                    </CardDescription>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl hover:bg-green-500/10 hover:text-green-600 transition-colors" 
                    onClick={onManageItems}
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </CardHeader>
            
            <CardContent className="space-y-4 p-4 pt-0 relative">
                {/* Quick Log Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    {customItems.map((item: string) => {
                        const isLogged = todaysLoggedItems.some((li: LoggedFoodItem) => li.name === item);
                        const isFlashing = flashingItem === item;
                        
                        return (
                            <button 
                                key={item} 
                                onClick={() => !isLogged && handleLogItem(item)} 
                                disabled={isLogged} 
                                className={cn(
                                    "group relative flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border-2",
                                    isLogged 
                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-800 cursor-default" 
                                        : "bg-background border-border hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-950/20 hover:shadow-md hover:scale-105 cursor-pointer active:scale-95",
                                    isFlashing && "animate-pulse ring-2 ring-green-500/50"
                                )}
                            >
                                <span className={cn(
                                    "transition-colors",
                                    isLogged ? "text-green-700 dark:text-green-300" : "text-foreground group-hover:text-green-600"
                                )}>
                                    {item}
                                </span>
                                {isLogged ? (
                                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500/20">
                                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                ) : (
                                    <PlusCircle className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <Separator />

                {/* Today's Logged Items */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Today's Log
                    </h4>
                    <ScrollArea className="max-h-40">
                        <div className="space-y-2 pr-2">
                            {todaysLoggedItems.length > 0 ? [...todaysLoggedItems].reverse().map((item: LoggedFoodItem) => (
                                <div 
                                    key={item.id} 
                                    className="group flex justify-between items-center text-sm bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 p-3 rounded-xl border border-green-200/50 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-800 transition-all duration-200 hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/50">
                                            <Apple className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-green-700 dark:text-green-300">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{format(parseISO(item.timestamp), 'h:mm a')}</p>
                                        </div>
                                    </div>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-all duration-200"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No items logged yet today</p>
                                    <p className="text-xs mt-1">Click items above to log them</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
function FoodManagerDialog({
    isOpen,
    onOpenChange,
    customItems,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    customItems: string[];
    onSave: (items: string[]) => void;
}) {
    const [editedItems, setEditedItems] = useState(customItems);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        if(isOpen) {
            setEditedItems(customItems);
        }
    }, [isOpen, customItems]);

    const handleAddItem = () => {
        if (!newItem.trim()) {
            return;
        }
        if (editedItems.map(i => i.toLowerCase()).includes(newItem.trim().toLowerCase())) {
            return;
        }
        setEditedItems([...editedItems, newItem.trim()]);
        setNewItem('');
    };

    const handleDeleteItem = (itemToDelete: string) => {
        setEditedItems(editedItems.filter(item => item !== itemToDelete));
    };

    const handleSave = () => {
        onSave(editedItems);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Quick-Log Items</DialogTitle>
                    <DialogDescription>
                        Add or remove food and supplement items for quick logging.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g., Creatine"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddItem();
                            }}
                        />
                        <Button onClick={handleAddItem}><Plus className="h-4 w-4" /> Add</Button>
                    </div>
                    <Separator />
                    <ScrollArea className="h-64">
                        <div className="space-y-2 pr-4">
                            {editedItems.length > 0 ? (
                                editedItems.map(item => (
                                    <div key={item} className="flex items-center justify-between rounded-md bg-muted p-2">
                                        <span className="text-sm font-medium">{item}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => handleDeleteItem(item)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-muted-foreground pt-8">
                                    No custom items yet.
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
function OverloadSetup({ exercise, onExerciseChange }: { exercise: Exercise, onExerciseChange: (field: keyof Exercise, value: string | number) => void }) {
    return (
        <Accordion type="single" collapsible className="w-full mt-2">
            <AccordionItem value="overload-setup" className="border-none bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border border-purple-200/50 dark:border-purple-900/30">
                <AccordionTrigger className="px-3 py-2 hover:no-underline group">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-colors">
                            <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-purple-700 dark:text-purple-300">Progressive Overload</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor={`k-value-${exercise.id}`} className="text-xs font-medium flex items-center gap-2">
                            <BarChart2 className="h-3.5 w-3.5 text-purple-500" />
                            Exercise Type
                        </Label>
                        <Select value={String(exercise.kValue || 0.5)} onValueChange={(v) => onExerciseChange('kValue', parseFloat(v))}>
                            <SelectTrigger className="h-9 text-sm border-purple-200 dark:border-purple-900/50 bg-background/50 hover:bg-background transition-colors">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0.3" className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                        <span>Isolation (e.g., Curl)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="0.5" className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>Compound (e.g., Bench Press)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="0.6" className="text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span>Heavy Compound (e.g., Squat)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-purple-700 dark:text-purple-300">
                            <Zap className="h-3.5 w-3.5" />
                            <span>Baseline Metrics</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label htmlFor={`base-weight-${exercise.id}`} className="text-xs text-muted-foreground">Weight (kg)</Label>
                                <div className="relative">
                                    <Input 
                                        id={`base-weight-${exercise.id}`} 
                                        type="number" 
                                        value={exercise.baselineWeight || ''} 
                                        onChange={(e) => onExerciseChange('baselineWeight', parseFloat(e.target.value))} 
                                        className="h-9 text-sm pr-8 border-purple-200 dark:border-purple-900/50 bg-background/50"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`base-reps-${exercise.id}`} className="text-xs text-muted-foreground">Reps</Label>
                                <div className="relative">
                                    <Input 
                                        id={`base-reps-${exercise.id}`} 
                                        type="number" 
                                        value={exercise.baselineReps || ''} 
                                        onChange={(e) => onExerciseChange('baselineReps', parseFloat(e.target.value))} 
                                        className="h-9 text-sm pr-8 border-purple-200 dark:border-purple-900/50 bg-background/50"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-green-700 dark:text-green-300">
                            <Target className="h-3.5 w-3.5" />
                            <span>Target Goals</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <Label htmlFor={`target-weight-${exercise.id}`} className="text-xs text-muted-foreground">Weight (kg)</Label>
                                <div className="relative">
                                    <Input 
                                        id={`target-weight-${exercise.id}`} 
                                        type="number" 
                                        value={exercise.targetWeight || ''} 
                                        onChange={(e) => onExerciseChange('targetWeight', parseFloat(e.target.value))} 
                                        className="h-9 text-sm pr-8 border-green-200 dark:border-green-900/50 bg-background/50"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kg</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`target-reps-${exercise.id}`} className="text-xs text-muted-foreground">Reps</Label>
                                <div className="relative">
                                    <Input 
                                        id={`target-reps-${exercise.id}`} 
                                        type="number" 
                                        value={exercise.targetReps || ''} 
                                        onChange={(e) => onExerciseChange('targetReps', parseFloat(e.target.value))} 
                                        className="h-9 text-sm pr-8 border-green-200 dark:border-green-900/50 bg-background/50"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
function OverloadTrackerDialog({
    isOpen, onOpenChange, workoutSplit, onWorkoutSplitChange, todaysExercises
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workoutSplit: CyclicalWorkoutSplit;
    onWorkoutSplitChange: (split: CyclicalWorkoutSplit) => void;
    todaysExercises: Exercise[];
}) {
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [sessionWeight, setSessionWeight] = useState('');
    const [sessionReps, setSessionReps] = useState('');
    const [sessionDate, setSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [activeTab, setActiveTab] = useState<'overview' | 'chart' | 'history'>('overview');

    const allExercises = useMemo(() => {
        return Object.values(workoutSplit).flatMap(day => day.exercises);
    }, [workoutSplit]);

    const selectedExercise = useMemo(() => {
        if (!selectedExerciseId) return null;
        return allExercises.find(ex => ex.id === selectedExerciseId) || null;
    }, [selectedExerciseId, allExercises]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedExerciseId(null);
            setSessionWeight('');
            setSessionReps('');
            setSessionDate(format(new Date(), 'yyyy-MM-dd'));
            setActiveTab('overview');
        }
    }, [isOpen]);

    // --- Core Logic Engine ---
    const calculateE1RM = (weight: number, reps: number) => weight * (1 + reps / 30);

    const calculateProgressiveOverload = useCallback((
        sessionHistory: ExerciseSession[], 
        baseline: { weight: number; reps: number }, 
        target: { weight: number; reps: number }, 
        k: number
    ) => {
        const { weight: WL, reps: RL } = baseline;
        const { weight: WT, reps: RT } = target;
        const e1RM_L = calculateE1RM(WL, RL);
        const e1RM_T = calculateE1RM(WT, RT);
        const intensityRange = e1RM_T - e1RM_L;
        const weightRange = WT - WL;
        const repRange = RT - RL;
        let lastScore = 0;
        
        const results = [{ session: 1, weight: WL, reps: RL, score: 0, scoreDelta: 0 }];
        
        sessionHistory.forEach((session, index) => {
            const { weight: Wi, reps: Ri } = session;
            const e1RM_i = calculateE1RM(Wi, Ri);
            
            let intensityScore = (intensityRange > 0) ? (e1RM_i - e1RM_L) / intensityRange : (e1RM_i >= e1RM_L ? 1 : 0);
            intensityScore = Math.max(0, intensityScore);
            
            let weightProgress = (weightRange !== 0) ? (Wi - WL) / weightRange : (Wi >= WL ? 1 : 0);
            let repProgress = (repRange !== 0) ? (Ri - RL) / repRange : (Ri >= RL ? 1 : 0);
            
            weightProgress = Math.max(0, weightProgress);
            repProgress = Math.max(0, repProgress);
            
            const synergyScore = Math.sqrt(weightProgress * repProgress);
            const currentScore = (k * intensityScore) + ((1 - k) * synergyScore);
            const scoreDelta = currentScore - lastScore;
            
            results.push({ session: index + 2, weight: Wi, reps: Ri, score: currentScore, scoreDelta: scoreDelta });
            lastScore = currentScore;
        });
        
        return results;
    }, []);

    const overloadResults = useMemo(() => {
        if (!selectedExercise || !selectedExercise.sessionHistory) return [];
        const settings = {
            baseline: { weight: selectedExercise.baselineWeight || 0, reps: selectedExercise.baselineReps || 0 },
            target: { weight: selectedExercise.targetWeight || 0, reps: selectedExercise.targetReps || 0 },
            k: selectedExercise.kValue || 0.5
        };
        if (!settings.baseline.weight) return [];
        return calculateProgressiveOverload(selectedExercise.sessionHistory, settings.baseline, settings.target, settings.k);
    }, [selectedExercise, calculateProgressiveOverload]);

    // Calculate personal records and stats
    const stats = useMemo(() => {
        if (!selectedExercise || !selectedExercise.sessionHistory || selectedExercise.sessionHistory.length === 0) {
            return {
                maxWeight: 0,
                maxReps: 0,
                maxVolume: 0,
                maxE1RM: 0,
                avgWeight: 0,
                avgReps: 0,
                totalSessions: 0,
                progressRate: 0,
                achievement: null as { title: string; icon: string; color: string } | null
            };
        }

        const history = selectedExercise.sessionHistory;
        let maxWeight = 0;
        let maxReps = 0;
        let maxVolume = 0;
        let maxE1RM = 0;
        let totalWeight = 0;
        let totalReps = 0;

        history.forEach(session => {
            const e1rm = calculateE1RM(session.weight, session.reps);
            const volume = session.weight * session.reps;
            
            if (session.weight > maxWeight) maxWeight = session.weight;
            if (session.reps > maxReps) maxReps = session.reps;
            if (volume > maxVolume) maxVolume = volume;
            if (e1rm > maxE1RM) maxE1RM = e1rm;
            
            totalWeight += session.weight;
            totalReps += session.reps;
        });

        const avgWeight = totalWeight / history.length;
        const avgReps = totalReps / history.length;
        const totalSessions = history.length;

        // Calculate progress rate
        let progressRate = 0;
        if (overloadResults.length > 1) {
            const firstScore = overloadResults[0].score;
            const lastScore = overloadResults[overloadResults.length - 1].score;
            progressRate = ((lastScore - firstScore) / totalSessions) * 100;
        }

        // Determine achievement badge
        let achievement = null;
        if (totalSessions >= 50) {
            achievement = { title: 'Legendary', icon: '👑', color: 'from-yellow-400 to-amber-600' };
        } else if (totalSessions >= 30) {
            achievement = { title: 'Master', icon: '🏆', color: 'from-purple-400 to-pink-600' };
        } else if (totalSessions >= 15) {
            achievement = { title: 'Expert', icon: '⭐', color: 'from-blue-400 to-cyan-600' };
        } else if (totalSessions >= 5) {
            achievement = { title: 'Rising Star', icon: '🌟', color: 'from-green-400 to-emerald-600' };
        } else if (totalSessions >= 1) {
            achievement = { title: 'Beginner', icon: '🔥', color: 'from-orange-400 to-red-600' };
        }

        return {
            maxWeight,
            maxReps,
            maxVolume,
            maxE1RM,
            avgWeight,
            avgReps,
            totalSessions,
            progressRate,
            achievement
        };
    }, [selectedExercise, overloadResults, calculateE1RM]);

    const handleAddSession = () => {
        const weight = parseFloat(sessionWeight);
        const reps = parseInt(sessionReps);

        if (!selectedExerciseId || isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
            return;
        }

        const newSession: ExerciseSession = { weight, reps, date: sessionDate };
        const newSplit = JSON.parse(JSON.stringify(workoutSplit));
        
        let exerciseFound = false;
        for (const dayKey in newSplit) {
            const day = newSplit[dayKey];
            const exIndex = day.exercises.findIndex((ex: Exercise) => ex.id === selectedExerciseId);
            if (exIndex !== -1) {
                if (!day.exercises[exIndex].sessionHistory) {
                    day.exercises[exIndex].sessionHistory = [];
                }
                day.exercises[exIndex].sessionHistory.push(newSession);
                // Sort by date descending (newest first)
                day.exercises[exIndex].sessionHistory.sort((a: ExerciseSession, b: ExerciseSession) => {
                    const dateA = a.date || '';
                    const dateB = b.date || '';
                    return dateB.localeCompare(dateA);
                });
                exerciseFound = true;
                break;
            }
        }

        if (exerciseFound) {
            onWorkoutSplitChange(newSplit);
            setSessionWeight('');
            setSessionReps('');
            setSessionDate(format(new Date(), 'yyyy-MM-dd'));
        }
    };

    const handleDeleteSession = (sessionIndex: number) => {
        if (!selectedExerciseId) return;

        const newSplit = JSON.parse(JSON.stringify(workoutSplit));
        
        for (const dayKey in newSplit) {
            const day = newSplit[dayKey];
            const exIndex = day.exercises.findIndex((ex: Exercise) => ex.id === selectedExerciseId);
            if (exIndex !== -1 && day.exercises[exIndex].sessionHistory) {
                day.exercises[exIndex].sessionHistory.splice(sessionIndex, 1);
                onWorkoutSplitChange(newSplit);
                break;
            }
        }
    };
    
    const latestResult = overloadResults[overloadResults.length - 1];
    let feedbackText = "Log a session to see feedback.";
    let feedbackClass = "";
    if (latestResult && latestResult.session > 1) {
        if (latestResult.scoreDelta > 0.02) { feedbackText = "Great Progress! ▲"; feedbackClass = 'text-green-600'; } 
        else if (latestResult.scoreDelta > 0) { feedbackText = "Solid Improvement ▲"; feedbackClass = 'text-green-500'; } 
        else if (latestResult.scoreDelta === 0) { feedbackText = "Stable Performance –"; } 
        else { feedbackText = "Slight Dip ▼"; feedbackClass = 'text-red-500'; }
    }


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-6xl h-[90vh] flex flex-col p-0 bg-white dark:bg-gray-950">
                <DialogHeader className="p-3 border-b relative bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                            <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-base font-bold text-white flex items-center gap-1.5">
                                Progressive Overload Tracker
                                {stats.achievement && (
                                    <span className="text-base">{stats.achievement.icon}</span>
                                )}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    {/* Exercise Selection Cards */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b p-3 shadow-sm">
                        <div className="max-w-6xl mx-auto">
                            <Label className="text-xs font-semibold mb-2 block">Select Exercise</Label>
                            {todaysExercises.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {todaysExercises.map((ex) => (
                                        <button
                                            key={ex.id}
                                            onClick={() => setSelectedExerciseId(ex.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 hover:shadow-md",
                                                selectedExerciseId === ex.id
                                                    ? "bg-gradient-to-br from-purple-500 to-pink-500 border-purple-500 text-white"
                                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300"
                                            )}
                                        >
                                            <Dumbbell className={cn(
                                                "h-5 w-5",
                                                selectedExerciseId === ex.id ? "text-white" : "text-purple-600 dark:text-purple-400"
                                            )} />
                                            <span className={cn(
                                                "text-xs font-semibold text-center line-clamp-2",
                                                selectedExerciseId === ex.id ? "text-white" : "text-gray-900 dark:text-gray-100"
                                            )}>
                                                {ex.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <Dumbbell className="h-12 w-12 mb-2 opacity-50" />
                                    <p className="text-sm font-medium">No exercises scheduled for today</p>
                                    <p className="text-xs mt-1">Add exercises to your workout plan to track them</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-3 pb-6">
                        <div className="max-w-6xl mx-auto">
                        
                        {selectedExercise ? (
                            <div className="space-y-3">
                                {/* Achievement Badge */}
                                {stats.achievement && (
                                    <Card className={cn("bg-gradient-to-r", stats.achievement.color, "border-0 text-white")}>
                                        <CardContent className="p-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="text-2xl">{stats.achievement.icon}</div>
                                                <div>
                                                    <h3 className="text-base font-bold">{stats.achievement.title}</h3>
                                                    <p className="text-xs text-white/90">{stats.totalSessions} sessions completed</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Stats Overview Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <Card className="bg-white dark:bg-gray-800">
                                        <CardContent className="p-2">
                                            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                                                <Trophy className="h-3.5 w-3.5" />
                                                <span className="text-xs font-semibold">Max Weight</span>
                                            </div>
                                            <div className="text-lg font-bold">{stats.maxWeight}kg</div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-white dark:bg-gray-800">
                                        <CardContent className="p-2">
                                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                                                <Target className="h-3.5 w-3.5" />
                                                <span className="text-xs font-semibold">Max Reps</span>
                                            </div>
                                            <div className="text-lg font-bold">{stats.maxReps}</div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-white dark:bg-gray-800">
                                        <CardContent className="p-2">
                                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 mb-1">
                                                <Activity className="h-3.5 w-3.5" />
                                                <span className="text-xs font-semibold">Max Volume</span>
                                            </div>
                                            <div className="text-lg font-bold">{stats.maxVolume.toFixed(0)}</div>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card className="bg-white dark:bg-gray-800">
                                        <CardContent className="p-2">
                                            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 mb-1">
                                                <Zap className="h-3.5 w-3.5" />
                                                <span className="text-xs font-semibold">Est. 1RM</span>
                                            </div>
                                            <div className="text-lg font-bold">{stats.maxE1RM.toFixed(1)}kg</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Tabs for different views */}
                                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 h-9 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border">
                                        <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
                                            <Info className="h-3.5 w-3.5 mr-1.5" />
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="chart" className="text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
                                            <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
                                            Charts
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
                                            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                            History
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="mt-3 space-y-3">
                                        {/* Log New Session */}
                                        <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-purple-500">
                                            <CardHeader className="p-2.5">
                                                <CardTitle className="text-sm flex items-center gap-1.5">
                                                    <PlusCircle className="h-4 w-4 text-purple-600" />
                                                    Log New Session
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-2.5 pt-0">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <div>
                                                        <Label htmlFor="session-weight" className="text-xs font-semibold">Weight (kg)</Label>
                                                        <Input 
                                                            id="session-weight" 
                                                            type="number" 
                                                            placeholder="e.g., 65" 
                                                            value={sessionWeight} 
                                                            onChange={e => setSessionWeight(e.target.value)}
                                                            className="h-8 text-sm mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="session-reps" className="text-xs font-semibold">Reps</Label>
                                                        <Input 
                                                            id="session-reps" 
                                                            type="number" 
                                                            placeholder="e.g., 8" 
                                                            value={sessionReps} 
                                                            onChange={e => setSessionReps(e.target.value)}
                                                            className="h-8 text-sm mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="session-date" className="text-xs font-semibold">Date</Label>
                                                        <Input 
                                                            id="session-date" 
                                                            type="date" 
                                                            value={sessionDate} 
                                                            onChange={e => setSessionDate(e.target.value)}
                                                            className="h-8 text-sm mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={handleAddSession} 
                                                    className="w-full h-9 mt-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-sm font-semibold shadow-lg"
                                                >
                                                    <PlusCircle className="mr-1.5 h-4 w-4"/> Add Session
                                                </Button>
                                            </CardContent>
                                        </Card>

                                        {/* Latest Feedback */}
                                        {latestResult && latestResult.session > 1 && (
                                            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-l-4 border-l-blue-500">
                                                <CardHeader className="p-2.5">
                                                    <CardTitle className="text-sm flex items-center gap-1.5">
                                                        <TrendingUp className="h-4 w-4 text-blue-600" />
                                                        Latest Performance
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-2.5 pt-0 text-center">
                                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                                        {latestResult.weight}kg × {latestResult.reps}
                                                    </div>
                                                    <div className={cn("text-base font-bold", feedbackClass)}>
                                                        {feedbackText}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Score: {latestResult.score.toFixed(3)} ({latestResult.scoreDelta > 0 ? '+' : ''}{latestResult.scoreDelta.toFixed(3)})
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Progress Summary */}
                                        <Card className="bg-white dark:bg-gray-800">
                                            <CardHeader className="p-2.5">
                                                <CardTitle className="text-sm">Progress Summary</CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-2.5 pt-0 space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-muted-foreground">Average Weight:</span>
                                                    <span className="text-sm font-semibold">{stats.avgWeight.toFixed(1)}kg</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-muted-foreground">Average Reps:</span>
                                                    <span className="text-sm font-semibold">{stats.avgReps.toFixed(1)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-muted-foreground">Total Sessions:</span>
                                                    <span className="text-sm font-semibold">{stats.totalSessions}</span>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-semibold">Progress Rate:</span>
                                                    <span className={cn("text-sm font-bold", stats.progressRate > 0 ? "text-green-600" : "text-red-600")}>
                                                        {stats.progressRate > 0 ? '+' : ''}{stats.progressRate.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="chart" className="mt-3 space-y-3">
                                        {overloadResults.length > 0 ? (
                                            <>
                                                {/* Progress Score Chart */}
                                                <Card className="bg-white dark:bg-gray-800">
                                                    <CardHeader className="p-2.5">
                                                        <CardTitle className="text-sm">Progress Score Trend</CardTitle>
                                                        <CardDescription className="text-xs">Track your overall strength progression</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="p-2.5 pt-0 h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={overloadResults} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                                <defs>
                                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="session" tickFormatter={(val) => `S${val}`} />
                                                                <YAxis domain={[0, 'dataMax + 0.1']} />
                                                                <RechartsTooltip 
                                                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                                                    formatter={(value: any) => value.toFixed(3)}
                                                                />
                                                                <Area type="monotone" dataKey="score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>

                                                {/* Weight & Reps Bar Chart */}
                                                <Card className="bg-white dark:bg-gray-800">
                                                    <CardHeader className="p-2.5">
                                                        <CardTitle className="text-sm">Weight & Reps Distribution</CardTitle>
                                                        <CardDescription className="text-xs">Compare weight and reps across sessions</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="p-2.5 pt-0 h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={overloadResults} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="session" tickFormatter={(val) => `S${val}`} />
                                                                <YAxis />
                                                                <RechartsTooltip 
                                                                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                                                />
                                                                <Legend />
                                                                <Bar dataKey="weight" fill="#3b82f6" name="Weight (kg)" />
                                                                <Bar dataKey="reps" fill="#10b981" name="Reps" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground text-center p-4">
                                                <BarChart2 className="h-16 w-16 mb-4 opacity-50" />
                                                <p className="text-lg font-medium">No data to display yet</p>
                                                <p className="text-sm">Log your first session to see progress charts</p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="history" className="mt-3">
                                        <Card className="bg-white dark:bg-gray-800">
                                            <CardHeader className="p-2.5">
                                                <CardTitle className="text-sm flex items-center justify-between">
                                                    <span>Session History</span>
                                                    <span className="text-xs font-normal text-muted-foreground">{stats.totalSessions} total</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                {selectedExercise.sessionHistory && selectedExercise.sessionHistory.length > 0 ? (
                                                    <ScrollArea className="h-[400px]">
                                                        <Table>
                                                            <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-900">
                                                                <TableRow className="h-8">
                                                                    <TableHead className="w-16 text-xs py-1">Session</TableHead>
                                                                    <TableHead className="text-xs py-1">Date</TableHead>
                                                                    <TableHead className="text-xs py-1">Weight</TableHead>
                                                                    <TableHead className="text-xs py-1">Reps</TableHead>
                                                                    <TableHead className="text-xs py-1">Volume</TableHead>
                                                                    <TableHead className="text-xs py-1">E1RM</TableHead>
                                                                    <TableHead className="text-center text-xs py-1">Trend</TableHead>
                                                                    <TableHead className="w-12 py-1"></TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {selectedExercise.sessionHistory.map((session, i) => {
                                                                    const volume = session.weight * session.reps;
                                                                    const e1rm = calculateE1RM(session.weight, session.reps);
                                                                    const result = overloadResults[i];
                                                                    
                                                                    return (
                                                                        <TableRow key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 h-9">
                                                                            <TableCell className="font-semibold text-xs py-1">#{i + 1}</TableCell>
                                                                            <TableCell className="text-xs py-1">{session.date ? format(parseISO(session.date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                                                            <TableCell className="font-medium text-xs py-1">{session.weight}kg</TableCell>
                                                                            <TableCell className="font-medium text-xs py-1">{session.reps}</TableCell>
                                                                            <TableCell className="text-xs text-muted-foreground py-1">{volume.toFixed(0)}</TableCell>
                                                                            <TableCell className="text-xs text-muted-foreground py-1">{e1rm.toFixed(1)}kg</TableCell>
                                                                            <TableCell className="text-center py-1">
                                                                                {result && i > 0 && (
                                                                                    <span className={cn(
                                                                                        "inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs",
                                                                                        result.scoreDelta > 0 && "bg-green-100 text-green-600 dark:bg-green-900/30",
                                                                                        result.scoreDelta < 0 && "bg-red-100 text-red-600 dark:bg-red-900/30",
                                                                                        result.scoreDelta === 0 && "bg-gray-100 text-gray-600 dark:bg-gray-800"
                                                                                    )}>
                                                                                        {result.scoreDelta > 0 ? '↑' : result.scoreDelta < 0 ? '↓' : '−'}
                                                                                    </span>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell className="py-1">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-6 w-6 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                                    onClick={() => handleDeleteSession(i)}
                                                                                >
                                                                                    <X className="h-3 w-3 text-red-500" />
                                                                                </Button>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                            </TableBody>
                                                        </Table>
                                                    </ScrollArea>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-center p-4">
                                                        <CalendarIcon className="h-16 w-16 mb-4 opacity-50" />
                                                        <p className="text-lg font-medium">No sessions logged yet</p>
                                                        <p className="text-sm">Start tracking your progress by logging your first session</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[300px] text-muted-foreground text-center p-4">
                                <Dumbbell className="h-20 w-20 mb-4 opacity-50" />
                                <p className="text-xl font-semibold mb-2">Select an exercise to begin</p>
                                <p className="text-sm">Choose an exercise from the cards above to track your progress</p>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-2 border-t bg-white dark:bg-gray-950 flex-shrink-0">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-4 text-sm font-semibold"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
function GymSettingsDialog({
  isOpen,
  onOpenChange,
  workoutSplit,
  cycleConfig,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  workoutSplit: CyclicalWorkoutSplit;
  cycleConfig: CycleConfig;
  onSave: (newSplit: CyclicalWorkoutSplit, newConfig: CycleConfig) => void;
}) {
  const [editedSplit, setEditedSplit] = useState<CyclicalWorkoutSplit>({});
  const [editedConfig, setEditedConfig] = useState<CycleConfig>({
    startDate: '',
    startDayKey: '',
  });

  useEffect(() => {
    if (isOpen) {
      setEditedSplit(JSON.parse(JSON.stringify(workoutSplit)));
      setEditedConfig(JSON.parse(JSON.stringify(cycleConfig)));
    }
  }, [isOpen, workoutSplit, cycleConfig]);
  
  const sortedEntries = useMemo(() => Object.entries(editedSplit).sort((a, b) => {
    const numA = parseInt(a[0].split(' ')[1], 10);
    const numB = parseInt(b[0].split(' ')[1], 10);
    if (isNaN(numA) || isNaN(numB)) {
        return a[0].localeCompare(b[0]);
    }
    return numA - numB;
  }), [editedSplit]);

  const handleDayTitleChange = (dayKey: string, newTitle: string) => {
    setEditedSplit((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], title: newTitle },
    }));
  };

  const handleExerciseChange = (
    dayKey: string,
    exIndex: number,
    field: keyof Exercise,
    value: string | number
  ) => {
    setEditedSplit((prev) => {
      const newSplit = JSON.parse(JSON.stringify(prev));
      const exercise = newSplit[dayKey].exercises[exIndex];
      if (typeof value === 'number' && isNaN(value)) {
        exercise[field] = undefined;
      } else {
        exercise[field] = value;
      }
      return newSplit;
    });
  };

  const handleAddExercise = (dayKey: string) => {
    setEditedSplit((prev) => {
      const newSplit = { ...prev };
      const newExercise: Exercise = {
        id: `ex-${crypto.randomUUID()}`,
        name: 'New Exercise',
        sets: '3-4',
        kValue: 0.5,
        baselineWeight: 0,
        baselineReps: 0,
        targetWeight: 0,
        targetReps: 0,
        sessionHistory: [],
      };
      newSplit[dayKey].exercises.push(newExercise);
      return newSplit;
    });
  };

  const handleDeleteExercise = (dayKey: string, exIndex: number) => {
    setEditedSplit((prev) => {
      const newSplit = { ...prev };
      newSplit[dayKey].exercises.splice(exIndex, 1);
      return newSplit;
    });
  };

  const handleAddDay = () => {
    setEditedSplit((prev) => {
      const newDayKey = `Day ${Object.keys(prev).length + 1}`;
      return { ...prev, [newDayKey]: { title: 'New Workout Day', exercises: [] } };
    });
  };

  const handleDeleteDay = (dayKey: string) => {
    setEditedSplit((prev) => {
      const newSplit = { ...prev };
      delete newSplit[dayKey];
      // Also unset startDayKey if it was the deleted day
      if (editedConfig.startDayKey === dayKey) {
        setEditedConfig((c) => ({ ...c, startDayKey: '' }));
      }
      return newSplit;
    });
  };

  const handleSaveChanges = () => {
    onSave(editedSplit, editedConfig);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl rounded-2xl flex flex-col h-[85vh] p-0 overflow-hidden bg-white dark:bg-gray-950">
        
        <DialogHeader className="p-6 border-b flex-shrink-0 relative bg-gradient-to-r from-purple-500 to-blue-500">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                Manage Gym Plan
              </DialogTitle>
              <DialogDescription className="text-sm mt-1 text-white/90">
                Customize your workout split and track progress
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            <Tabs defaultValue="plan" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border">
                <TabsTrigger 
                  value="plan" 
                  className="text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Workout Plan
                </TabsTrigger>
                <TabsTrigger 
                  value="cycle" 
                  className="text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Cycle Config
                </TabsTrigger>
              </TabsList>
              <TabsContent value="plan" className="mt-4">
                <Accordion type="multiple" className="w-full space-y-3">
                  {sortedEntries.map(([dayKey, dayData]) => (
                    <AccordionItem
                      value={dayKey}
                      key={dayKey}
                      className="bg-white dark:bg-gray-800 border rounded-xl px-4 shadow-sm"
                    >
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {dayKey}: {dayData.title}
                          </span>
                           <div
                                className="mr-2 h-8 w-8 inline-flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteDay(dayKey);
                                }}
                                role="button"
                                aria-label={`Delete ${dayKey}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-3">
                        <div>
                          <Label
                            htmlFor={`title-${dayKey}`}
                            className="text-sm font-medium"
                          >
                            Day Title
                          </Label>
                          <Input
                            id={`title-${dayKey}`}
                            value={dayData.title}
                            onChange={(e) =>
                              handleDayTitleChange(dayKey, e.target.value)
                            }
                            className="h-10 text-sm mt-1.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Exercises</h4>
                           <ScrollArea className="h-56 rounded-xl border bg-gray-50 dark:bg-gray-900 p-3">
                            <div className="space-y-3 pr-2">
                              {dayData.exercises.map((ex, exIndex) => (
                                <div key={ex.id || crypto.randomUUID()} className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      placeholder="Exercise name"
                                      value={ex.name}
                                      onChange={(e) =>
                                        handleExerciseChange(
                                          dayKey,
                                          exIndex,
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      className="flex-grow h-9 text-sm"
                                    />
                                    <Input
                                      placeholder="Sets"
                                      value={ex.sets}
                                      onChange={(e) =>
                                        handleExerciseChange(
                                          dayKey,
                                          exIndex,
                                          'sets',
                                          e.target.value
                                        )
                                      }
                                      className="w-20 h-9 text-sm"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() =>
                                        handleDeleteExercise(dayKey, exIndex)
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                  <OverloadSetup
                                    exercise={ex}
                                    onExerciseChange={(field, value) =>
                                      handleExerciseChange(
                                        dayKey,
                                        exIndex,
                                        field,
                                        value
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                           </ScrollArea>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 text-sm font-medium mt-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300"
                            onClick={() => handleAddExercise(dayKey)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Exercise
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 h-10 px-4 text-sm font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600 shadow-md"
                  onClick={handleAddDay}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Workout Day
                </Button>
              </TabsContent>
              <TabsContent value="cycle" className="mt-4">
                <div className="space-y-5">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm">
                    <Label className="text-sm font-semibold">Cycle Start Date</Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Select the date your cycle begins.
                    </p>
                    <Calendar
                      mode="single"
                      selected={
                        editedConfig.startDate
                          ? parseISO(editedConfig.startDate)
                          : new Date()
                      }
                      onSelect={(date) =>
                        date &&
                        setEditedConfig((prev) => ({
                          ...prev,
                          startDate: format(date, 'yyyy-MM-dd'),
                        }))
                      }
                      className="rounded-xl border bg-gray-50 dark:bg-gray-900 mx-auto"
                    />
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm">
                    <Label className="text-sm font-semibold">
                      Starting Day of Cycle
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Select which workout corresponds to the start date.
                    </p>
                    <Select
                      value={editedConfig.startDayKey}
                      onValueChange={(value) =>
                        setEditedConfig((prev) => ({
                          ...prev,
                          startDayKey: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedEntries.map(([dayKey, dayData]) => (
                          <SelectItem
                            key={dayKey}
                            value={dayKey}
                            className="text-sm"
                          >
                            {dayKey}: {dayData.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <DialogFooter className="p-4 border-t flex-shrink-0 bg-white dark:bg-gray-950 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-11 px-6 text-sm font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="h-11 px-6 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
            onClick={handleSaveChanges}
          >
            <Check className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default function GymPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // All gym-related state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [proteinIntakes, setProteinIntakes] = useState<ProteinIntake[]>([]);
  const [loggedFoodItems, setLoggedFoodItems] = useState<LoggedFoodItem[]>([]);
  const [proteinTarget, setProteinTarget] = useState(150);
  const [customFoodItems, setCustomFoodItems] = useState<string[]>(initialCustomFoodItems);
  const [cyclicalWorkoutSplit, setCyclicalWorkoutSplit] = useState<CyclicalWorkoutSplit>(initialWorkoutSplit);
  const [cycleConfig, setCycleConfig] = useState<CycleConfig>({ startDate: format(new Date(), 'yyyy-MM-dd'), startDayKey: "Day 1" });
  
  // Dialog states
  const [isGymSettingsOpen, setIsGymSettingsOpen] = useState(false);
  const [isFoodManagerOpen, setIsFoodManagerOpen] = useState(false);
  const [isOverloadTrackerOpen, setIsOverloadTrackerOpen] = useState(false);
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    overloadTracker: true,
    gymProteinIntake: true,
    gymFoodSupplements: true,
  });

  const handleProteinIntakesUpdate = useCallback((updatedIntakes: ProteinIntake[]) => {
      setProteinIntakes(updatedIntakes);
  }, []);

  const handleLoggedFoodItemsUpdate = useCallback((updatedItems: LoggedFoodItem[]) => {
      setLoggedFoodItems(updatedItems);
  }, []);

  const handleProteinTargetUpdate = useCallback((newTarget: number) => {
      setProteinTarget(newTarget);
  }, []);

  const handleCustomFoodItemsUpdate = useCallback((newItems: string[]) => {
      setCustomFoodItems(newItems);
  }, []);
  
  const handleWorkoutSplitUpdate = useCallback((newSplit: CyclicalWorkoutSplit) => {
    setCyclicalWorkoutSplit(newSplit);
  }, []);

  const handleCycleConfigUpdate = useCallback((newConfig: CycleConfig) => {
    setCycleConfig(newConfig);
  }, []);

  const handleHabitsUpdate = useCallback((newHabits: Habit[]) => {
    setHabits(newHabits);
  }, []);

  const handleToggleWorkoutCompletion = () => {
    if (!workoutHabit) return;
    const newHabits = habits.map(h => {
        if (h.id === workoutHabit.id) {
            const newCompletions = { ...h.completions };
            if (isTodayWorkoutCompleted) delete newCompletions[todayKey];
            else newCompletions[todayKey] = true;
            return { ...h, completions: newCompletions };
        }
        return h;
    });
    handleHabitsUpdate(newHabits);
  };

  const getWorkoutDayInfo = useWorkoutDayInfo(cyclicalWorkoutSplit, cycleConfig);
  const todaysWorkoutInfo = useMemo(() => getWorkoutDayInfo(new Date()), [getWorkoutDayInfo]);
  
  const workoutHabit = habits.find(h => h.icon === 'Dumbbell');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isTodayWorkoutCompleted = workoutHabit ? !!workoutHabit.completions[todayKey] : false;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <GymTracker 
          proteinIntakes={proteinIntakes}
          onProteinIntakesChange={handleProteinIntakesUpdate}
          loggedFoodItems={loggedFoodItems}
          onLoggedFoodItemsChange={handleLoggedFoodItemsUpdate}
          proteinTarget={proteinTarget}
          onProteinTargetChange={handleProteinTargetUpdate}
          customFoodItems={customFoodItems}
          onManageCustomFoodItems={() => setIsFoodManagerOpen(true)}
          onManagePlan={() => setIsGymSettingsOpen(true)}
          onToggleWorkoutCompletion={handleToggleWorkoutCompletion}
          isTodayCompleted={isTodayWorkoutCompleted}
          todaysWorkoutInfo={todaysWorkoutInfo}
          onOpenOverloadTracker={() => setIsOverloadTrackerOpen(true)}
          cyclicalWorkoutSplit={cyclicalWorkoutSplit}
          onWorkoutSplitChange={handleWorkoutSplitUpdate}
          preferences={preferences}
        />
      </div>

      {/* All gym dialogs */}
      
      <GymSettingsDialog
        isOpen={isGymSettingsOpen}
        onOpenChange={setIsGymSettingsOpen}
        workoutSplit={cyclicalWorkoutSplit}
        cycleConfig={cycleConfig}
        onSave={(newSplit, newConfig) => {
          handleWorkoutSplitUpdate(newSplit);
          handleCycleConfigUpdate(newConfig);
          setIsGymSettingsOpen(false);
        }}
      />
      <FoodManagerDialog
        isOpen={isFoodManagerOpen}
        onOpenChange={setIsFoodManagerOpen}
        customItems={customFoodItems}
        onSave={(newItems) => {
          handleCustomFoodItemsUpdate(newItems);
          setIsFoodManagerOpen(false);
        }}
      />
      <OverloadTrackerDialog
        isOpen={isOverloadTrackerOpen}
        onOpenChange={setIsOverloadTrackerOpen}
        workoutSplit={cyclicalWorkoutSplit}
        onWorkoutSplitChange={handleWorkoutSplitUpdate}
        todaysExercises={todaysWorkoutInfo.exercises}
      />
    </AppLayout>
  );
}