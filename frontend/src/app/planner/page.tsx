
'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PlusCircle, Trash, Loader2, Calendar, Clock, Tag,
  Sunrise, Coffee, Sun, Sunset, Moon, Edit, CheckCircle2,
  MoreVertical, Palette, Bell, Repeat, Settings2,
} from 'lucide-react';
import type { PlannerItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { usePlanner } from '@/hooks/api';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getCurrentDayName = () => {
  const idx = new Date().getDay();
  return daysOfWeek[idx === 0 ? 6 : idx - 1];
};

const timePresets = [
  { label: 'Morning',   icon: Sunrise, start: '06:00', end: '09:00' },
  { label: 'Breakfast', icon: Coffee,  start: '09:00', end: '10:00' },
  { label: 'Afternoon', icon: Sun,     start: '12:00', end: '14:00' },
  { label: 'Evening',   icon: Sunset,  start: '17:00', end: '19:00' },
  { label: 'Night',     icon: Moon,    start: '20:00', end: '22:00' },
];

const tagColors: Record<string, string> = {
  Work:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Personal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  College:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Exercise: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Meeting:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Study:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const COLOR_LABELS = [
  '#00DF82', '#6366f1', '#F492F0', '#FFB800',
  '#FE7F2D', '#D7263D', '#0094BA', '#2D6A4F',
  '#E11D48', '#7C3AED', '#06B6D4', '#64748b',
];

const REMINDER_OFFSETS = [5, 10, 15, 30, 60];
const repeatLabels: Record<string, string> = {
  none: 'No repeat', daily: 'Every day', weekdays: 'Weekdays (Monâ€“Fri)',
  custom: 'Custom days', interval: 'Every N days',
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type EditState = {
  title: string; startTime: string; endTime: string; tag: string; addToAllWeek: boolean;
};

type ConfigState = {
  colorLabel: string;
  repeatType: 'none' | 'daily' | 'weekdays' | 'custom' | 'interval';
  customDays: string[];
  intervalDays: number;
  reminderEnabled: boolean;
  reminderOffset: number;
};

const defaultEdit = (): EditState => ({ title: '', startTime: '09:00', endTime: '10:00', tag: '', addToAllWeek: false });
const defaultConfig = (): ConfigState => ({
  colorLabel: '', repeatType: 'none', customDays: [], intervalDays: 2,
  reminderEnabled: false, reminderOffset: 15,
});

function itemToEditState(item: PlannerItem): EditState {
  return { title: item.title, startTime: item.startTime, endTime: item.endTime, tag: item.tag || '', addToAllWeek: false };
}
function itemToConfigState(item: PlannerItem): ConfigState {
  return {
    colorLabel: item.colorLabel || '',
    repeatType: item.repeat?.type ?? 'none',
    customDays: item.repeat?.days ?? [],
    intervalDays: item.repeat?.intervalDays ?? 2,
    reminderEnabled: item.reminder?.enabled ?? false,
    reminderOffset: item.reminder?.offsetMinutes ?? 15,
  };
}

// â”€â”€â”€ Duration helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
}

// â”€â”€â”€ Planner card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PlannerCard({
  item, day,
  onEdit, onConfigure, onDelete,
}: {
  item: PlannerItem; day: string;
  onEdit: () => void; onConfigure: () => void; onDelete: () => void;
}) {
  const tagColor = item.tag ? (tagColors[item.tag] || 'bg-gray-100 text-gray-700') : '';
  const accent = item.colorLabel || 'var(--primary)';
  const duration = getDuration(item.startTime, item.endTime);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className="flex">
        {/* Colored left accent bar */}
        <div className="w-1 shrink-0 rounded-l-lg" style={{ backgroundColor: accent }} />

        <CardContent className="flex-1 p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Time column */}
            <div className="flex flex-col items-center shrink-0 w-12 pt-0.5">
              <span className="text-xs font-semibold text-foreground">{item.startTime}</span>
              <div className="w-px flex-1 min-h-[20px] my-1" style={{ background: `${accent}60` }} />
              <span className="text-xs text-muted-foreground">{item.endTime}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm sm:text-base leading-tight truncate">{item.title}</h4>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                    {duration && (
                      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{duration}
                      </span>
                    )}
                    {item.tag && (
                      <Badge className={cn('text-[10px] h-4 px-1.5', tagColor)}>
                        <Tag className="h-2.5 w-2.5 mr-0.5" />{item.tag}
                      </Badge>
                    )}
                    {item.repeat && item.repeat.type !== 'none' && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                        <Repeat className="h-2.5 w-2.5" />
                        {repeatLabels[item.repeat.type]}
                      </Badge>
                    )}
                    {item.reminder?.enabled && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5 text-primary border-primary/30">
                        <Bell className="h-2.5 w-2.5" />
                        {item.reminder.offsetMinutes}m before
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 3-dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onSelect={onEdit}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onConfigure}>
                      <Settings2 className="mr-2 h-4 w-4" /> Configure
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// â”€â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PlannerPage() {
  const { weeklySchedule, isLoading, addItem: addItemApi, updateItem: updateItemApi, deleteItem: deleteItemApi } = usePlanner();
  const [selectedDay, setSelectedDay] = useState(getCurrentDayName());

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlannerItem | null>(null);
  const [editState, setEditState] = useState<EditState>(defaultEdit());

  // Configure dialog state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configuringItem, setConfiguringItem] = useState<PlannerItem | null>(null);
  const [configState, setConfigState] = useState<ConfigState>(defaultConfig());

  // â”€â”€ Edit handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openAdd = () => {
    setEditingItem(null);
    setEditState(defaultEdit());
    setIsEditOpen(true);
  };

  const openEdit = (item: PlannerItem) => {
    setEditingItem(item);
    setEditState(itemToEditState(item));
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editState.title.trim() || editState.startTime >= editState.endTime) return;

    if (editingItem) {
      await updateItemApi({
        day: selectedDay, id: editingItem.id,
        updates: { title: editState.title.trim(), startTime: editState.startTime, endTime: editState.endTime, tag: editState.tag || undefined },
      });
    } else {
      const days = editState.addToAllWeek ? daysOfWeek : [selectedDay];
      for (const day of days) {
        await addItemApi({ day, item: { startTime: editState.startTime, endTime: editState.endTime, title: editState.title.trim(), tag: editState.tag || undefined } });
      }
    }
    setIsEditOpen(false);
  };

  // â”€â”€ Configure handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openConfigure = (item: PlannerItem) => {
    setConfiguringItem(item);
    setConfigState(itemToConfigState(item));
    setIsConfigOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!configuringItem) return;
    const updates: Partial<PlannerItem> = {
      colorLabel: configState.colorLabel || undefined,
      repeat: configState.repeatType === 'none' ? undefined : {
        type: configState.repeatType,
        days: configState.repeatType === 'custom' ? configState.customDays : undefined,
        intervalDays: configState.repeatType === 'interval' ? configState.intervalDays : undefined,
      },
      reminder: configState.reminderEnabled
        ? { enabled: true, offsetMinutes: configState.reminderOffset }
        : undefined,
    };
    await updateItemApi({ day: selectedDay, id: configuringItem.id, updates });
    setIsConfigOpen(false);
  };

  const toggleCustomDay = (day: string) => {
    setConfigState(prev => ({
      ...prev,
      customDays: prev.customDays.includes(day)
        ? prev.customDays.filter(d => d !== day)
        : [...prev.customDays, day],
    }));
  };

  const handleDelete = async (day: string, id: string) => {
    await deleteItemApi({ day, id });
  };

  const totalItems = Object.values(weeklySchedule).reduce((s, items) => s + items.length, 0);
  const daySchedule = weeklySchedule[selectedDay] || [];

  return (
    <AppLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-64 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading schedule...</span>
        </div>
      ) : (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Daily Planner
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalItems} task{totalItems !== 1 ? 's' : ''} scheduled this week
            </p>
          </div>
          <Button onClick={openAdd} className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Week Tabs */}
        <Tabs value={selectedDay} onValueChange={setSelectedDay}>
          <TabsList className="grid w-full grid-cols-7">
            {daysOfWeek.map((day) => (
              <TabsTrigger key={day} value={day} className="text-xs px-1 sm:px-2">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold">{day.slice(0, 3)}</span>
                  <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
                    {(weeklySchedule[day] || []).length}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {daysOfWeek.map((day) => (
            <TabsContent key={day} value={day} className="mt-4">
              {(weeklySchedule[day] || []).length === 0 ? (
                <Card className="p-10">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-primary/10 p-5">
                        <Clock className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No tasks for {day}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Tap the card menu or Add Task to get started</p>
                    </div>
                    <Button onClick={openAdd}>
                      <PlusCircle className="mr-2 h-4 w-4" />Add Task
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(weeklySchedule[day] || []).map((item, index) => {
                    const prev = index > 0 ? (weeklySchedule[day] || [])[index - 1] : null;
                    const hasGap = prev && prev.endTime < item.startTime;
                    return (
                      <div key={item.id}>
                        {hasGap && (
                          <div className="flex items-center gap-2 my-1 px-2">
                            <div className="flex-1 border-t border-dashed border-border/60" />
                            <span className="text-[10px] text-muted-foreground bg-background px-1">free time</span>
                            <div className="flex-1 border-t border-dashed border-border/60" />
                          </div>
                        )}
                        <PlannerCard
                          item={item}
                          day={day}
                          onEdit={() => openEdit(item)}
                          onConfigure={() => openConfigure(item)}
                          onDelete={() => handleDelete(day, item.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* â”€â”€ Edit / Add Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Dialog open={isEditOpen} onOpenChange={(o) => { if (!o) { setIsEditOpen(false); setEditingItem(null); setEditState(defaultEdit()); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Task' : 'Add Task'}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Update task details.' : `New task for ${selectedDay}.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Team Meeting, Workout Session"
                  value={editState.title}
                  onChange={(e) => setEditState(s => ({ ...s, title: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Quick presets */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {timePresets.map((p) => {
                    const Icon = p.icon;
                    return (
                      <Button key={p.label} variant="outline" size="sm" className="h-7 text-xs"
                        onClick={() => setEditState(s => ({ ...s, startTime: p.start, endTime: p.end }))}>
                        <Icon className="h-3 w-3 mr-1" />{p.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Time range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input type="time" value={editState.startTime} onChange={(e) => setEditState(s => ({ ...s, startTime: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input type="time" value={editState.endTime} onChange={(e) => setEditState(s => ({ ...s, endTime: e.target.value }))} />
                </div>
              </div>

              {/* Tag */}
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.keys(tagColors).map((tag) => (
                    <Button key={tag} variant={editState.tag === tag ? 'default' : 'outline'} size="sm" className="h-7 text-xs"
                      onClick={() => setEditState(s => ({ ...s, tag: s.tag === tag ? '' : tag }))}>
                      {editState.tag === tag && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Add to all week (create only) */}
              {!editingItem && (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/40">
                  <Checkbox id="all-week" checked={editState.addToAllWeek}
                    onCheckedChange={(c) => setEditState(s => ({ ...s, addToAllWeek: !!c }))} />
                  <Label htmlFor="all-week" className="text-sm font-normal cursor-pointer">
                    Add to all days this week
                  </Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={!editState.title.trim() || editState.startTime >= editState.endTime}>
                {editingItem ? 'Update' : 'Add Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* â”€â”€ Configure Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Dialog open={isConfigOpen} onOpenChange={(o) => { if (!o) setIsConfigOpen(false); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Configure Task
              </DialogTitle>
              <DialogDescription>
                Set colour, repeat schedule, and push reminder for <strong>{configuringItem?.title}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Color label */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Palette className="h-4 w-4" />Card Colour</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_LABELS.map((color) => (
                    <button key={color} onClick={() => setConfigState(s => ({ ...s, colorLabel: s.colorLabel === color ? '' : color }))}
                      className={cn('w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                        configState.colorLabel === color ? 'border-foreground scale-110' : 'border-transparent')}
                      style={{ background: color }}
                    />
                  ))}
                  {configState.colorLabel && (
                    <button onClick={() => setConfigState(s => ({ ...s, colorLabel: '' }))}
                      className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground text-muted-foreground text-xs flex items-center justify-center">
                      âœ•
                    </button>
                  )}
                </div>
              </div>

              {/* Repeat */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Repeat className="h-4 w-4" />Repeat</Label>
                <Select value={configState.repeatType} onValueChange={(v: ConfigState['repeatType']) => setConfigState(s => ({ ...s, repeatType: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(repeatLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {configState.repeatType === 'custom' && (
                  <div className="flex gap-1 flex-wrap pt-1">
                    {daysOfWeek.map((day) => (
                      <button key={day} onClick={() => toggleCustomDay(day)}
                        className={cn('text-xs px-2 py-1 rounded-full border transition-colors',
                          configState.customDays.includes(day)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:border-primary')}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                )}

                {configState.repeatType === 'interval' && (
                  <div className="flex items-center gap-2 pt-1">
                    <Label className="text-sm shrink-0">Every</Label>
                    <Input type="number" min={2} max={30} value={configState.intervalDays}
                      onChange={(e) => setConfigState(s => ({ ...s, intervalDays: parseInt(e.target.value) || 2 }))}
                      className="w-20 h-8" />
                    <Label className="text-sm shrink-0">days</Label>
                  </div>
                )}
              </div>

              {/* Push Reminder */}
              <div className="space-y-3 rounded-xl border p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 cursor-pointer" htmlFor="reminder-switch">
                    <Bell className="h-4 w-4 text-primary" />Push Reminder
                  </Label>
                  <Switch id="reminder-switch" checked={configState.reminderEnabled}
                    onCheckedChange={(v) => setConfigState(s => ({ ...s, reminderEnabled: v }))} />
                </div>
                {configState.reminderEnabled && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Notify me before</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {REMINDER_OFFSETS.map((m) => (
                        <button key={m} onClick={() => setConfigState(s => ({ ...s, reminderOffset: m }))}
                          className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                            configState.reminderOffset === m
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:border-primary')}>
                          {m >= 60 ? `${m / 60}h` : `${m}m`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveConfig}>Save Config</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      )}
    </AppLayout>
  );
}
