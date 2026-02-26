
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Trash, Loader2, Calendar, Clock, Tag, Sunrise, Coffee, Sun, Sunset, Moon, Edit, CheckCircle2 } from 'lucide-react';
import type { PlannerItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

// Mock data for initial state
const MOCK_SCHEDULE: Record<string, PlannerItem[]> = {};
daysOfWeek.forEach(day => { MOCK_SCHEDULE[day] = [] });


const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const getCurrentDayName = () => {
    const today = new Date();
    const dayIndex = today.getDay(); // Sunday: 0, Monday: 1, ...
    return daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1];
};

const timePresets = [
    { label: 'Morning', icon: Sunrise, start: '06:00', end: '09:00' },
    { label: 'Breakfast', icon: Coffee, start: '09:00', end: '10:00' },
    { label: 'Afternoon', icon: Sun, start: '12:00', end: '14:00' },
    { label: 'Evening', icon: Sunset, start: '17:00', end: '19:00' },
    { label: 'Night', icon: Moon, start: '20:00', end: '22:00' },
];

const tagColors: Record<string, string> = {
    'Work': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Personal': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'College': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'Exercise': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'Meeting': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'Study': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export default function PlannerPage() {
    const { user } = useAuth();
    const [weeklySchedule, setWeeklySchedule] = useState<Record<string, PlannerItem[]>>({});
    const [selectedDay, setSelectedDay] = useState(getCurrentDayName());
    const [isLoading, setIsLoading] = useState(true);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemStartTime, setNewItemStartTime] = useState('09:00');
    const [newItemEndTime, setNewItemEndTime] = useState('10:00');
    const [newItemTag, setNewItemTag] = useState('');
    const [newItemAddToAllWeek, setNewItemAddToAllWeek] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PlannerItem | null>(null);

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        // Mock data loading
        setTimeout(() => {
            setWeeklySchedule(MOCK_SCHEDULE);
            setIsLoading(false);
        }, 500);
    }, [user]);

    const saveSchedule = async (newSchedule: Record<string, PlannerItem[]>) => {
        if (!user) return;
        setWeeklySchedule(newSchedule);
        console.log('Saving schedule:', newSchedule);
    };
    
    const handleAddAdhocItem = () => {
        if (!newItemTitle.trim() || newItemStartTime >= newItemEndTime) return;
        
        if (editingItem) {
            // Update existing item
            const newSchedule = { ...weeklySchedule };
            newSchedule[selectedDay] = (newSchedule[selectedDay] || []).map(item =>
                item.id === editingItem.id
                    ? { ...item, title: newItemTitle.trim(), startTime: newItemStartTime, endTime: newItemEndTime, tag: newItemTag.trim() || undefined }
                    : item
            ).sort((a, b) => a.startTime.localeCompare(b.startTime));
            saveSchedule(newSchedule);
            setEditingItem(null);
        } else {
            // Add new item
            const daysToUpdate = newItemAddToAllWeek ? daysOfWeek : [selectedDay];
            const newSchedule = { ...weeklySchedule };

            daysToUpdate.forEach(day => {
                const newItem: PlannerItem = { id: `${day.toLowerCase()}-${Date.now()}`, startTime: newItemStartTime, endTime: newItemEndTime, title: newItemTitle.trim(), tag: newItemTag.trim() || undefined, };
                newSchedule[day] = [...(newSchedule[day] || []), newItem].sort((a, b) => a.startTime.localeCompare(b.startTime));
            });
            saveSchedule(newSchedule);
        }
        
        setNewItemTitle(''); 
        setNewItemStartTime('09:00'); 
        setNewItemEndTime('10:00'); 
        setNewItemTag(''); 
        setNewItemAddToAllWeek(false);
        setIsAddDialogOpen(false);
    };

    const handleEditItem = (item: PlannerItem) => {
        setEditingItem(item);
        setNewItemTitle(item.title);
        setNewItemStartTime(item.startTime);
        setNewItemEndTime(item.endTime);
        setNewItemTag(item.tag || '');
        setIsAddDialogOpen(true);
    };

    const applyTimePreset = (start: string, end: string) => {
        setNewItemStartTime(start);
        setNewItemEndTime(end);
    };

    const handleDeleteAdhocItem = (day: string, itemId: string) => {
        const newSchedule = { ...weeklySchedule };
        newSchedule[day] = (newSchedule[day] || []).filter(item => item.id !== itemId);
        saveSchedule(newSchedule);
    };

    const totalItems = Object.values(weeklySchedule).reduce((sum, items) => sum + items.length, 0);
    const daySchedule = weeklySchedule[selectedDay] || [];

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /><p className="ml-2">Loading schedule...</p></div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                            <Calendar className="h-7 w-7 text-primary" />
                            Daily Planner
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {totalItems} task{totalItems !== 1 ? 's' : ''} scheduled this week
                        </p>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </div>

                {/* Week Tabs */}
                <Tabs value={selectedDay} onValueChange={setSelectedDay}>
                    <TabsList className="grid w-full grid-cols-7">
                        {daysOfWeek.map(day => (
                            <TabsTrigger key={day} value={day} className="text-xs px-2">
                                <div className="flex flex-col items-center">
                                    <span className="font-semibold">{day.slice(0, 3)}</span>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 mt-0.5">
                                        {(weeklySchedule[day] || []).length}
                                    </Badge>
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {daysOfWeek.map(day => (
                        <TabsContent key={day} value={day} className="mt-4">
                            {/* Empty State */}
                            {(weeklySchedule[day] || []).length === 0 ? (
                                <Card className="p-12">
                                    <div className="text-center space-y-4">
                                        <div className="flex justify-center">
                                            <div className="rounded-full bg-primary/10 p-6">
                                                <Clock className="h-12 w-12 text-primary" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">No tasks scheduled</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Add your first task for {day}
                                            </p>
                                        </div>
                                        <Button onClick={() => setIsAddDialogOpen(true)}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add First Task
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                /* Timeline View */
                                <div className="space-y-2">
                                    {(weeklySchedule[day] || []).map((item, index) => {
                                        const tagColor = item.tag ? (tagColors[item.tag] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300') : '';
                                        const prevItem = index > 0 ? (weeklySchedule[day] || [])[index - 1] : null;
                                        const hasGap = prevItem && prevItem.endTime < item.startTime;

                                        return (
                                            <div key={item.id}>
                                                {hasGap && (
                                                    <div className="flex items-center gap-2 my-1 px-4">
                                                        <div className="flex-1 border-t border-dashed"></div>
                                                        <span className="text-xs text-muted-foreground">Free time</span>
                                                        <div className="flex-1 border-t border-dashed"></div>
                                                    </div>
                                                )}
                                                <Card className="hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-4">
                                                            {/* Time Badge */}
                                                            <div className="flex flex-col items-center shrink-0">
                                                                <div className="text-xs text-muted-foreground font-medium">
                                                                    {item.startTime}
                                                                </div>
                                                                <div className="w-px h-6 bg-border my-1"></div>
                                                                <div className="text-xs text-muted-foreground font-medium">
                                                                    {item.endTime}
                                                                </div>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold text-base">{item.title}</h4>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                                <Clock className="h-3 w-3" />
                                                                                {(() => {
                                                                                    const start = item.startTime.split(':');
                                                                                    const end = item.endTime.split(':');
                                                                                    const minutes = (parseInt(end[0]) * 60 + parseInt(end[1])) - (parseInt(start[0]) * 60 + parseInt(start[1]));
                                                                                    const hours = Math.floor(minutes / 60);
                                                                                    const mins = minutes % 60;
                                                                                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                                                                                })()}
                                                                            </div>
                                                                            {item.tag && (
                                                                                <Badge className={cn("text-xs", tagColor)}>
                                                                                    <Tag className="h-3 w-3 mr-1" />
                                                                                    {item.tag}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Actions */}
                                                                    <div className="flex gap-1">
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleEditItem(item)}
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-8 w-8 text-destructive"
                                                                            onClick={() => handleDeleteAdhocItem(day, item.id)}
                                                                        >
                                                                            <Trash className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Add/Edit Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) {
                        setEditingItem(null);
                        setNewItemTitle('');
                        setNewItemStartTime('09:00');
                        setNewItemEndTime('10:00');
                        setNewItemTag('');
                        setNewItemAddToAllWeek(false);
                    }
                }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                            <DialogDescription>
                                {editingItem ? 'Update the task details' : `Create a new task for ${selectedDay}`}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="task-title">Task Title</Label>
                                <Input 
                                    id="task-title"
                                    placeholder="e.g., Team Meeting, Workout Session"
                                    value={newItemTitle}
                                    onChange={(e) => setNewItemTitle(e.target.value)}
                                />
                            </div>

                            {/* Time Presets */}
                            <div className="space-y-2">
                                <Label>Quick Time Presets</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {timePresets.map(preset => {
                                        const Icon = preset.icon;
                                        return (
                                            <Button
                                                key={preset.label}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => applyTimePreset(preset.start, preset.end)}
                                            >
                                                <Icon className="h-3 w-3 mr-1" />
                                                {preset.label}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-time">Start Time</Label>
                                    <Input 
                                        id="start-time"
                                        type="time"
                                        value={newItemStartTime}
                                        onChange={(e) => setNewItemStartTime(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-time">End Time</Label>
                                    <Input 
                                        id="end-time"
                                        type="time"
                                        value={newItemEndTime}
                                        onChange={(e) => setNewItemEndTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Tag Selection */}
                            <div className="space-y-2">
                                <Label>Category (Optional)</Label>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.keys(tagColors).map(tag => (
                                        <Button
                                            key={tag}
                                            variant={newItemTag === tag ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setNewItemTag(tag === newItemTag ? '' : tag)}
                                            className={newItemTag === tag ? "" : ""}
                                        >
                                            {newItemTag === tag && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                            {tag}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Add to All Week */}
                            {!editingItem && (
                                <div className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/50">
                                    <Checkbox 
                                        id="add-to-week"
                                        checked={newItemAddToAllWeek}
                                        onCheckedChange={(checked) => setNewItemAddToAllWeek(!!checked)}
                                    />
                                    <Label htmlFor="add-to-week" className="text-sm font-normal cursor-pointer">
                                        Add to all days this week
                                    </Label>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddAdhocItem} disabled={!newItemTitle.trim() || newItemStartTime >= newItemEndTime}>
                                {editingItem ? 'Update Task' : 'Add Task'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
