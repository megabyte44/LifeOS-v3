'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell, BellRing, Cake, Heart, CalendarCheck, PlusCircle,
  MoreVertical, Edit, Trash, Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isSameDay, parseISO } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
type EventType = 'reminder' | 'birthday' | 'anniversary' | 'deadline';

type ReminderEvent = {
  id: string;
  title: string;
  date: string;       // ISO date-only "YYYY-MM-DD"
  type: EventType;
  notes?: string;
  repeat?: 'none' | 'yearly' | 'monthly';
  pushEnabled: boolean;
  pushOffsetMinutes: number; // minutes before event (for reminder/deadline)
};

// ─── Event type config ────────────────────────────────────────────────────────
const EVENT_TYPES: Record<EventType, { label: string; icon: React.ElementType; color: string; badgeClass: string }> = {
  reminder:    { label: 'Reminder',    icon: Bell,         color: 'text-blue-500',   badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  birthday:    { label: 'Birthday',    icon: Cake,         color: 'text-pink-500',   badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  anniversary: { label: 'Anniversary', icon: Heart,        color: 'text-rose-500',   badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  deadline:    { label: 'Deadline',    icon: CalendarCheck,color: 'text-orange-500', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};

const PUSH_OFFSETS = [5, 10, 15, 30, 60, 120, 1440]; // minutes

function offsetLabel(m: number): string {
  if (m < 60) return `${m}m before`;
  if (m < 1440) return `${m / 60}h before`;
  return `${m / 1440}d before`;
}

// ─── Local storage hooks ──────────────────────────────────────────────────────
const STORAGE_KEY = 'lifeos-reminders';

function useReminders() {
  const [events, setEvents] = useState<ReminderEvent[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const save = useCallback((updated: ReminderEvent[]) => {
    setEvents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addEvent = useCallback((e: Omit<ReminderEvent, 'id'>) => {
    save([...events, { ...e, id: `re-${Date.now()}` }]);
  }, [events, save]);

  const updateEvent = useCallback((id: string, updates: Partial<ReminderEvent>) => {
    save(events.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [events, save]);

  const deleteEvent = useCallback((id: string) => {
    save(events.filter(e => e.id !== id));
  }, [events, save]);

  return { events, addEvent, updateEvent, deleteEvent };
}

// ─── Get events that "occur" on a given date (considering yearly/monthly repeat) ─
function eventsOnDate(events: ReminderEvent[], date: Date): ReminderEvent[] {
  return events.filter(ev => {
    const evDate = parseISO(ev.date);
    if (isSameDay(evDate, date)) return true;
    if (ev.repeat === 'yearly' && evDate.getMonth() === date.getMonth() && evDate.getDate() === date.getDate()) return true;
    if (ev.repeat === 'monthly' && evDate.getDate() === date.getDate()) return true;
    return false;
  });
}

// ─── Event row ────────────────────────────────────────────────────────────────
function EventRow({
  event, onEdit, onDelete,
}: {
  event: ReminderEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { icon: Icon, color, badgeClass, label } = EVENT_TYPES[event.type];
  return (
    <div className="flex items-start gap-3 group p-3 rounded-xl hover:bg-muted/40 transition-colors">
      <div className={cn('shrink-0 rounded-lg p-2 mt-0.5 bg-muted', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{event.title}</p>
            <div className="flex items-center flex-wrap gap-1 mt-1">
              <Badge className={cn('text-[10px] h-4 px-1.5', badgeClass)}>{label}</Badge>
              {event.repeat && event.repeat !== 'none' && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                  <Repeat className="h-2.5 w-2.5" />
                  {event.repeat === 'yearly' ? 'Yearly' : 'Monthly'}
                </Badge>
              )}
              {event.pushEnabled && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5 text-primary border-primary/30">
                  <BellRing className="h-2.5 w-2.5" />
                  {offsetLabel(event.pushOffsetMinutes)}
                </Badge>
              )}
            </div>
            {event.notes && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.notes}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─── Event Form Dialog ────────────────────────────────────────────────────────
type FormState = {
  title: string;
  date: string;
  type: EventType;
  notes: string;
  repeat: 'none' | 'yearly' | 'monthly';
  pushEnabled: boolean;
  pushOffsetMinutes: number;
};

const defaultForm = (prefillDate?: Date): FormState => ({
  title: '',
  date: prefillDate ? format(prefillDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  type: 'reminder',
  notes: '',
  repeat: 'none',
  pushEnabled: false,
  pushOffsetMinutes: 15,
});

function eventToForm(ev: ReminderEvent): FormState {
  return {
    title: ev.title, date: ev.date, type: ev.type, notes: ev.notes ?? '',
    repeat: ev.repeat ?? 'none', pushEnabled: ev.pushEnabled,
    pushOffsetMinutes: ev.pushOffsetMinutes,
  };
}

function EventFormDialog({
  open, onOpenChange, editEvent, prefillDate, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editEvent: ReminderEvent | null;
  prefillDate?: Date;
  onSave: (form: FormState) => void;
}) {
  const [form, setForm] = useState<FormState>(defaultForm(prefillDate));

  useEffect(() => {
    if (open) setForm(editEvent ? eventToForm(editEvent) : defaultForm(prefillDate));
  }, [open, editEvent, prefillDate]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  const isBirthdayOrAnniv = form.type === 'birthday' || form.type === 'anniversary';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
          <DialogDescription>
            {editEvent ? 'Update this calendar event.' : 'Add a reminder, birthday, or anniversary.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="e.g., Mum's birthday" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => {
                const t = v as EventType;
                setForm(f => ({ ...f, type: t, repeat: (t === 'birthday' || t === 'anniversary') ? 'yearly' : 'none' }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(EVENT_TYPES) as [EventType, typeof EVENT_TYPES[EventType]][]).map(([k, { label, icon: Icon }]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />{label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Repeat</Label>
            <Select value={form.repeat} onValueChange={v => setForm(f => ({ ...f, repeat: v as FormState['repeat'] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No repeat</SelectItem>
                <SelectItem value="yearly">Every year</SelectItem>
                <SelectItem value="monthly">Every month</SelectItem>
              </SelectContent>
            </Select>
            {isBirthdayOrAnniv && form.repeat === 'yearly' && (
              <p className="text-xs text-muted-foreground">This event repeats every year on the same date.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input placeholder="Optional notes…" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          {/* Push notification */}
          <div className="space-y-3 rounded-xl border p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-switch" className="flex items-center gap-1.5 cursor-pointer">
                <BellRing className="h-4 w-4 text-primary" />Push Reminder
              </Label>
              <Switch id="push-switch" checked={form.pushEnabled}
                onCheckedChange={v => setForm(f => ({ ...f, pushEnabled: v }))} />
            </div>
            {form.pushEnabled && (
              <div className="flex gap-1.5 flex-wrap">
                {PUSH_OFFSETS.map(m => (
                  <button key={m} onClick={() => setForm(f => ({ ...f, pushOffsetMinutes: m }))}
                    className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                      form.pushOffsetMinutes === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-primary')}>
                    {offsetLabel(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.title.trim()}>
            {editEvent ? 'Update' : 'Add Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RemindersPage() {
  const { events, addEvent, updateEvent, deleteEvent } = useReminders();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<ReminderEvent | null>(null);

  const todayEvents = eventsOnDate(events, selectedDate);

  // Days that have events (for calendar dot modifiers)
  const eventDays = events.reduce<Record<string, boolean>>((acc, ev) => {
    const evDate = parseISO(ev.date);
    // Mark the original date
    acc[format(evDate, 'yyyy-MM-dd')] = true;
    return acc;
  }, {});

  const openAdd = () => { setEditEvent(null); setDialogOpen(true); };
  const openEdit = (ev: ReminderEvent) => { setEditEvent(ev); setDialogOpen(true); };

  const handleSave = (form: FormState) => {
    if (editEvent) {
      updateEvent(editEvent.id, {
        title: form.title.trim(), date: form.date, type: form.type,
        notes: form.notes || undefined, repeat: form.repeat,
        pushEnabled: form.pushEnabled, pushOffsetMinutes: form.pushOffsetMinutes,
      });
    } else {
      addEvent({
        title: form.title.trim(), date: form.date, type: form.type,
        notes: form.notes || undefined, repeat: form.repeat,
        pushEnabled: form.pushEnabled, pushOffsetMinutes: form.pushOffsetMinutes,
      });
    }
  };

  // Upcoming events (next 30 days) for the sidebar strip
  const upcoming = events
    .filter(ev => {
      const d = parseISO(ev.date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const diff = d.getTime() - today.getTime();
      return diff >= 0 && diff <= 30 * 86400000;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const upcomingBirthdays = events
    .filter(ev => ev.type === 'birthday' || ev.type === 'anniversary')
    .sort((a, b) => {
      const today = new Date();
      const dA = parseISO(a.date);
      const dB = parseISO(b.date);
      // Calculate next occurrence
      const nextA = new Date(today.getFullYear(), dA.getMonth(), dA.getDate());
      if (nextA < today) nextA.setFullYear(today.getFullYear() + 1);
      const nextB = new Date(today.getFullYear(), dB.getMonth(), dB.getDate());
      if (nextB < today) nextB.setFullYear(today.getFullYear() + 1);
      return nextA.getTime() - nextB.getTime();
    })
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />Reminders
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {events.length} event{events.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <Button onClick={openAdd} className="shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" />Add Event
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          {/* Calendar */}
          <div className="space-y-3">
            <Card className="p-3 w-fit">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                modifiers={{ hasEvent: (date) => !!eventDays[format(date, 'yyyy-MM-dd')] }}
                modifiersClassNames={{ hasEvent: 'relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary' }}
                className="rounded-md"
              />
            </Card>

            {/* Upcoming birthdays/anniversaries */}
            {upcomingBirthdays.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Cake className="h-4 w-4 text-pink-500" />Upcoming
                  </h3>
                  <div className="space-y-2">
                    {upcomingBirthdays.map(ev => {
                      const d = parseISO(ev.date);
                      const today = new Date();
                      const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
                      if (next < today) next.setFullYear(today.getFullYear() + 1);
                      const daysUntil = Math.ceil((next.getTime() - today.setHours(0,0,0,0)) / 86400000);
                      const { icon: Icon, color } = EVENT_TYPES[ev.type];
                      return (
                        <div key={ev.id} className="flex items-center gap-2 text-xs">
                          <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
                          <span className="flex-1 truncate font-medium">{ev.title}</span>
                          <span className={cn('shrink-0 tabular-nums', daysUntil === 0 && 'text-primary font-bold')}>
                            {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Day detail panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
                {!isSameDay(selectedDate, new Date()) && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {format(selectedDate, 'yyyy')}
                  </span>
                )}
              </h2>
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={openAdd}>
                <PlusCircle className="h-3.5 w-3.5" />Add
              </Button>
            </div>

            {todayEvents.length === 0 ? (
              <Card className="p-8">
                <div className="text-center space-y-3">
                  <Bell className="mx-auto h-10 w-10 text-muted-foreground/30" />
                  <div>
                    <p className="font-medium">No events</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Nothing scheduled for {format(selectedDate, 'MMM d')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={openAdd}>Add Event</Button>
                </div>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-2 divide-y divide-border/40">
                  {todayEvents.map(ev => (
                    <EventRow
                      key={ev.id} event={ev}
                      onEdit={() => openEdit(ev)}
                      onDelete={() => deleteEvent(ev.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Upcoming (next 30 days) */}
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Next 30 Days</h3>
                <Card>
                  <CardContent className="p-2 divide-y divide-border/40">
                    {upcoming.map(ev => (
                      <EventRow
                        key={ev.id} event={ev}
                        onEdit={() => openEdit(ev)}
                        onDelete={() => deleteEvent(ev.id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <EventFormDialog
        open={dialogOpen} onOpenChange={setDialogOpen}
        editEvent={editEvent} prefillDate={selectedDate}
        onSave={handleSave}
      />
    </AppLayout>
  );
}
