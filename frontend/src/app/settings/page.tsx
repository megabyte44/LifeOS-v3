
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { applyTheme, THEME_CLASSES, type ThemeName } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dumbbell, Download, Upload, BellDot, Palette, Activity, Settings as SettingsIcon,
  ListChecks, CalendarCheck, Wallet, GlassWater, Target, KeyRound, StickyNote,
  Check, LayoutDashboard,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { usePreferences } from '@/hooks/api/use-preferences';
import { cn } from '@/lib/utils';
import type { UserPreferences } from '@/types';

// ─── Theme swatch config ─────────────────────────────────────────────────────
const themeOptions: { value: ThemeName; label: string; light: string; dark: string }[] = [
  { value: 'default',              label: 'Emerald',   light: '#00DF82', dark: '#030F0F' },
  { value: 'theme-indigo',         label: 'Indigo',    light: '#6366f1', dark: '#1e1b4b' },
  { value: 'theme-charcoal-yellow',label: 'Amber',     light: '#FFB800', dark: '#1a1a1a' },
  { value: 'theme-lavendar',       label: 'Lavender',  light: '#F492F0', dark: '#4a1773' },
  { value: 'theme-lemonade',       label: 'Lemonade',  light: '#B8FB3C', dark: '#1a1a3e' },
  { value: 'theme-sunset',         label: 'Sunset',    light: '#FE7F2D', dark: '#0c3140' },
  { value: 'theme-dreamy',         label: 'Dreamy',    light: '#0094BA', dark: '#003d4d' },
  { value: 'theme-crimson',        label: 'Crimson',   light: '#D7263D', dark: '#052e38' },
  { value: 'theme-forest',         label: 'Forest',    light: '#2D6A4F', dark: '#0a1f17' },
  { value: 'theme-midnight',       label: 'Midnight',  light: '#3B82F6', dark: '#0d1424' },
  { value: 'theme-aurora',         label: 'Aurora',    light: '#7C3AED', dark: '#180e2e' },
  { value: 'theme-rose',           label: 'Rose',      light: '#E11D48', dark: '#1a0713' },
];

function ThemePicker() {
  const [current, setCurrent] = useState<ThemeName>('default');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('lifeos-theme') as ThemeName) ?? 'default';
    setCurrent(saved);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const handleSelect = (theme: ThemeName) => {
    setCurrent(theme);
    applyTheme(theme);
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {themeOptions.map((t) => (
        <button
          key={t.value}
          onClick={() => handleSelect(t.value)}
          className={cn(
            'flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all',
            current === t.value
              ? 'border-primary shadow-md scale-105 bg-primary/5'
              : 'border-transparent hover:border-border hover:scale-105'
          )}
        >
          <div
            className="w-9 h-9 rounded-full shadow-sm flex items-center justify-center"
            style={{ background: isDark ? t.dark : t.light }}
          >
            {current === t.value && <Check className="h-4 w-4 text-white drop-shadow" />}
          </div>
          <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── App Features section ─────────────────────────────────────────────────────
const featureList: {
  key: keyof UserPreferences['features'];
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  { key: 'todaysPlan',       label: "Today's Plan",       description: "Daily schedule & time-block planner on dashboard",      icon: CalendarCheck },
  { key: 'financialSnapshot',label: 'Financial Snapshot', description: 'Recent transactions and balance overview',              icon: Wallet        },
  { key: 'todoList',         label: 'To-Do List',         description: 'Quick-access daily tasks and priorities widget',        icon: ListChecks    },
  { key: 'waterIntake',      label: 'Water Intake',       description: 'Hydration tracker with daily goal progress',           icon: GlassWater    },
  { key: 'gymTracker',       label: 'Gym Tracker',        description: 'Workout split, protein intake, and progress tracking', icon: Dumbbell      },
  { key: 'habitStreaks',     label: 'Habit Streaks',      description: 'Streak counters and completion heatmap',               icon: Activity      },
  { key: 'overloadTracker',  label: 'Progressive Overload', description: 'Per-exercise weight & rep tracking with history',   icon: Dumbbell      },
  { key: 'proteinIntake',    label: 'Protein Intake',     description: 'Log and track daily protein from food & supplements',  icon: GlassWater    },
];

// ─── Backup & Restore ─────────────────────────────────────────────────────────
function BackupAndRestore() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBackup = async () => {
    if (!user) return;
    const backupData = { timestamp: new Date().toISOString(), note: 'LifeOS backup' };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Backup downloaded' });
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = () => {
      toast({ title: 'Restored', description: 'Reloading...' });
      setTimeout(() => window.location.reload(), 2000);
    };
    reader.readAsText(event.target.files[0]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup &amp; Restore</CardTitle>
        <CardDescription>Download all your data or restore from a previous backup.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleBackup} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" /> Download Backup
        </Button>
        <div className="relative w-full sm:w-auto">
          <Button className="w-full pointer-events-none">
            <Upload className="mr-2 h-4 w-4" /> Restore from Backup
          </Button>
          <Input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Push notification manager ────────────────────────────────────────────────
function PushNotificationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkSub = async () => {
      if (!isSupported || Notification.permission !== 'granted') return;
      try {
        if (!navigator.serviceWorker.controller) { setIsSubscribed(false); return; }
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((_, rej) => setTimeout(() => rej(new Error('SW timeout')), 8000))
        ]) as ServiceWorkerRegistration;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch { setIsSubscribed(false); }
    };
    if (isSupported) checkSub();
  }, [isSupported, permission]);

  const urlBase64ToUint8Array = (b64: string) => {
    const padding = '='.repeat((4 - (b64.length % 4)) % 4);
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
  };

  const subscribeUser = async () => {
    if (!user || !isSupported || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    setIsLoading(true);
    try {
      if (!navigator.serviceWorker.controller) throw new Error('Service Worker not active. Refresh and try again.');
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, rej) => setTimeout(() => rej(new Error('SW timeout')), 15000))
      ]) as ServiceWorkerRegistration;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });
      const token = await user.getIdToken();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      setIsSubscribed(true);
      toast({ title: 'Subscribed ✅', description: 'You will now receive push notifications.' });
    } catch (e) {
      setIsSubscribed(false);
      toast({ variant: 'destructive', title: 'Subscription Failed', description: e instanceof Error ? e.message : 'Unknown error' });
    } finally { setIsLoading(false); }
  };

  const unsubscribeUser = async () => {
    if (!user || !isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        const token = await user.getIdToken();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setIsSubscribed(false);
      toast({ title: 'Unsubscribed' });
    } catch { toast({ variant: 'destructive', title: 'Failed to unsubscribe' }); }
    finally { setIsLoading(false); }
  };

  const handleToggle = async () => {
    if (isSubscribed) { await unsubscribeUser(); return; }
    if (permission === 'granted') { await subscribeUser(); return; }
    if (permission === 'default') {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p === 'granted') await subscribeUser();
      else toast({ variant: 'destructive', title: 'Permission required' });
    } else {
      toast({ variant: 'destructive', title: 'Notifications blocked', description: 'Enable them in browser settings.' });
    }
  };

  const handleSendTest = async () => {
    if (!user || !isSubscribed) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/push/send-test', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast({ title: 'Test sent 🎉', description: 'Check your device.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed', description: e instanceof Error ? e.message : 'Unknown error' });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BellDot />Push Notifications</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-destructive">Your browser does not support push notifications.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BellDot />Push Notifications</CardTitle>
        <CardDescription>Receive reminders on desktop and mobile, even when the app is closed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="push-switch" className="text-base">Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              {permission === 'denied' && 'Notifications are blocked in browser settings.'}
              {permission === 'granted' && isSubscribed && 'Notifications are active on this device.'}
              {permission === 'granted' && !isSubscribed && 'Click to complete subscription.'}
              {permission === 'default' && 'Allow notifications to receive reminders.'}
            </p>
          </div>
          <Switch id="push-switch" checked={isSubscribed} onCheckedChange={handleToggle} disabled={isLoading || permission === 'denied'} />
        </div>
        {permission === 'denied' && (
          <p className="text-xs text-destructive px-1">Enable notification permissions in your browser or system settings.</p>
        )}
      </CardContent>
      {isSubscribed && (
        <CardFooter>
          <Button onClick={handleSendTest} variant="secondary">Send Test Notification</Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ─── Main settings page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { preferences, isLoading, updatePreferences, isUpdating } = usePreferences();
  const { toast } = useToast();

  const toggle = async (key: keyof UserPreferences['features']) => {
    if (!preferences) return;
    try {
      await updatePreferences({
        features: { ...preferences.features, [key]: !preferences.features[key] },
      });
      toast({ title: 'Updated', description: `${key} ${!preferences.features[key] ? 'enabled' : 'disabled'}.` });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save', description: 'Could not update preference.' });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage appearance, features, and notifications.</p>
        </div>

        {/* ─ Appearance ─ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Theme
            </CardTitle>
            <CardDescription>Pick a colour theme. Changes apply instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemePicker />
          </CardContent>
        </Card>

        {/* ─ App Features ─ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              App Features
            </CardTitle>
            <CardDescription>Turn features on or off. Disabled features are hidden throughout the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : (
              featureList.map((feat) => {
                const Icon = feat.icon;
                const enabled = preferences?.features?.[feat.key] ?? true;
                return (
                  <div key={feat.key} className="flex items-center justify-between rounded-xl border p-4 transition-colors hover:bg-accent/30">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{feat.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{feat.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggle(feat.key)}
                      disabled={isUpdating}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ─ Push Notifications ─ */}
        <PushNotificationManager />

        {/* ─ Backup & Restore ─ */}
        <BackupAndRestore />
      </div>
    </AppLayout>
  );
}

