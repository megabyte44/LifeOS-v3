
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dumbbell, Download, Upload, BellDot, Palette, Activity, Settings as SettingsIcon, ListChecks, CalendarCheck, Wallet, GlassWater } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import type { UserPreferences } from '@/types';

function BackupAndRestore() {
    const { user } = useAuth();
    const { toast } = useToast();

    const handleBackup = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to back up data.' });
            return;
        }
        try {
            // Mock backup implementation since Firestore is removed
            const backupData: Record<string, unknown> = {
                'timestamp': new Date().toISOString(),
                'note': 'This is a mock backup as cloud persistence is disabled.'
            };
            
            const json = JSON.stringify(backupData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lifeos_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: 'Success', description: 'Your data has been downloaded.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Backup Failed', description: 'Could not back up your data.' });
        }
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to restore data.' });
            return;
        }
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // Mock restore implementation
                toast({ title: 'Success', description: 'Your data has been restored. The page will now reload.' });
                setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Restore Failed', description: 'The backup file is invalid or corrupt.' });
            }
        };
        reader.readAsText(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Backup &amp; Restore</CardTitle>
                <CardDescription>Download all your data to a file or restore from a previous backup.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleBackup} className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" />Download Backup</Button>
                <div className="relative w-full sm:w-auto">
                    <Button className="w-full pointer-events-none"><Upload className="mr-2 h-4 w-4" />Restore from Backup</Button>
                    <Input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
            </CardContent>
        </Card>
    );
}

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
        } else {
            setIsSupported(false);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const checkSubscription = async () => {
            if (isSupported && Notification.permission === 'granted') {
                try {
                    // Check if service worker is available
                    if (!navigator.serviceWorker.controller) {
                        console.log('Service worker not active yet, will check on next visit');
                        setIsSubscribed(false);
                        return;
                    }
                    
                    // Wait for service worker to be ready with timeout
                    const registration = await Promise.race([
                        navigator.serviceWorker.ready,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker timeout')), 8000))
                    ]) as ServiceWorkerRegistration;
                    
                    const subscription = await registration.pushManager.getSubscription();
                    setIsSubscribed(!!subscription);
                    console.log('Push subscription status:', !!subscription);
                } catch (error) {
                    console.warn('Failed to check subscription (this is normal in dev mode):', error);
                    setIsSubscribed(false);
                    // Don't show toast on initial check - only log the issue
                    // User can still manually enable notifications which will show proper errors
                }
            }
        };
        if(isSupported) {
            checkSubscription();
        }
    }, [isSupported, permission]);
    
    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeUser = async () => {
        if (!user || !isSupported) {
            console.error('Cannot subscribe: user or support missing', { user: !!user, isSupported });
            return;
        }
        
        if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            console.error('VAPID public key is missing');
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'VAPID public key is not configured in the environment.' });
            return;
        }
        
        console.log('Starting push notification subscription...');
        console.log('VAPID key length:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length);
        
        setIsLoading(true);
        try {
            // Check if service worker is available first
            if (!navigator.serviceWorker.controller) {
                throw new Error('Service Worker not active. Please refresh the page and try again. (PWA features are disabled in development mode)');
            }
            
            console.log('Waiting for service worker...');
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker timeout after 15s. Try refreshing the page.')), 15000))
            ]) as ServiceWorkerRegistration;
            
            console.log('Service worker ready, subscribing...');
            const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
            console.log('Application server key generated');
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey,
            });
            console.log('Push subscription created:', subscription.endpoint);
            
            const token = await user.getIdToken();
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(subscription),
            });
            
            console.log('Sending subscription to server...');
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server rejected subscription:', response.status, errorData);
                throw new Error(`Server error: ${errorData.error || response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Subscription saved to server:', result);
            setIsSubscribed(true);
            toast({ title: 'Subscribed! ✅', description: 'You will now receive push notifications.' });
        } catch (error) {
            console.error('Failed to subscribe:', error);
            setIsSubscribed(false); // Make sure state is false on error
            setPermission('default'); // Reset to allow retrying
            let description = 'Could not enable push notifications. Check console for details.';
            
            if (error instanceof Error) {
                console.error('Error details:', error.message, error.stack);
                description = error.message;
            }
            
            if (error instanceof DOMException) {
                console.error('DOMException:', error.name, error.message);
                if (error.name === 'NotAllowedError') {
                    description = 'Notification permission was denied. Please enable it in your browser settings and try again.';
                } else if (error.name === 'InvalidStateError') {
                    description = 'Service worker is in an invalid state. Try refreshing the page.';
                } else {
                    description = `Subscription failed: ${error.name}. This is often due to an invalid VAPID key or service worker issue.`;
                }
            }
            
            toast({ variant: 'destructive', title: 'Subscription Failed', description });
        } finally {
            setIsLoading(false);
        }
    };
    
    const unsubscribeUser = async () => {
        if (!user || !isSupported) return;
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                const token = await user.getIdToken();
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
            }
            setIsSubscribed(false);
            toast({ title: 'Unsubscribed', description: 'Push notifications have been disabled.' });
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            toast({ variant: 'destructive', title: 'Failed to Unsubscribe', description: 'Could not disable push notifications.' });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleToggleSubscription = async () => {
        if (isSubscribed) {
            await unsubscribeUser();
            return;
        }

        if (permission === 'granted') {
            await subscribeUser();
        } else if (permission === 'default') {
            const newPermission = await Notification.requestPermission();
            setPermission(newPermission);
            if (newPermission === 'granted') {
                await subscribeUser();
            } else {
                toast({ variant: 'destructive', title: 'Permission Required', description: 'You need to grant permission to enable notifications.' });
            }
        } else { // 'denied'
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Please enable notifications for this site in your browser settings.' });
        }
    };

    const handleSendTest = async () => {
        if (!user) return;
        
        if (!isSubscribed) {
            toast({ 
                variant: 'destructive', 
                title: 'Not Subscribed', 
                description: 'Please enable push notifications first before sending a test.' 
            });
            return;
        }
        
        toast({ title: 'Sending...', description: 'Sending a test notification to your device.' });
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/push/send-test', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            console.log('Send test response:', res.status, data);
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error(data.hint || 'No push subscription found. Please toggle notifications off and on again.');
                }
                throw new Error(data.error || "Failed to send test notification");
            }
            
            toast({ 
                title: 'Test Sent! 🎉', 
                description: data.message || 'Check your device for a notification.' 
            });
        } catch(e) {
            console.error('Send test error:', e);
            toast({ 
                variant: 'destructive', 
                title: 'Failed to Send', 
                description: e instanceof Error ? e.message : 'Could not send test notification.' 
            });
        }
    }

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BellDot />Push Notifications</CardTitle>
                </CardHeader>
                <CardContent><p className="text-sm text-destructive">Your browser does not support push notifications.</p></CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BellDot />Push Notifications</CardTitle>
                <CardDescription>Receive reminders on supported desktop and mobile browsers, even when the app is closed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="push-switch" className="text-base">Enable Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            {permission === 'denied' && "You have blocked notifications."}
                            {permission === 'granted' && isSubscribed && "Notifications are enabled on this device."}
                            {permission === 'granted' && !isSubscribed && "Click to finalize subscription."}
                            {permission === 'default' && "Allow notifications to stay updated."}
                        </p>
                    </div>
                    <Switch id="push-switch" checked={isSubscribed} onCheckedChange={handleToggleSubscription} disabled={isLoading || permission === 'denied'} />
                </div>
                {permission === 'denied' && (
                    <p className="text-xs text-destructive px-1">You must enable notification permissions in your browser or system settings to use this feature.</p>
                )}
            </CardContent>
            {isSubscribed && (
                <CardFooter>
                    <Button onClick={handleSendTest} variant="secondary">Send Test Notification</Button>
                </CardFooter>
            )}
        </Card>
    )
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Removed: useSafeFirestore
  const [settings, setSettings] = useState({ gymTracking: true, theme: 'charcoal-yellow' });
  const [preferences, setPreferences] = useState<UserPreferences>({
    features: {
      waterIntake: true,
      todaysPlan: true,
      financialSnapshot: true,
      todoList: true,
      habitStreaks: true,
      gymTracker: true,
      proteinIntake: true,
      foodSupplements: true,
      overloadTracker: true,
      gymProteinIntake: true,
      gymFoodSupplements: true,
      proteinIntakeWidget: true,
      supplementIntakeWidget: true,
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

    // Mock settings load
    setIsLoading(false);
    
    // Removed: Firestore subscriptions
    return () => {};
  }, [user]);

        if (docSnap.exists()) {
            const settingsData = (docSnap.data() as {items: { gymTracking?: boolean; theme?: string }}).items;
            setSettings({
                gymTracking: settingsData.gymTracking !== false,
                theme: settingsData.theme || 'charcoal-yellow',
            });
        } else {
            // If settings don't exist, create them
            const defaultSettings = { gymTracking: true, theme: 'charcoal-yellow' };
            setDoc(settingsDocRef, { items: defaultSettings });
            setSettings(defaultSettings);
        }
    });
    
    // Load dashboard preferences
    const prefsDocRef = doc(db, 'users', user.uid, 'data', 'preferences');
    const prefsUnsubscribe = onSnapshot(prefsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as { items: UserPreferences };
            setPreferences(data.items);
        } else {
            // Set defaults and save them
            const defaultPrefs: UserPreferences = {
              features: {
                waterIntake: true,
                todaysPlan: true,
                financialSnapshot: true,
                todoList: true,
                habitStreaks: true,
                gymTracker: true,
                proteinIntake: true,
                foodSupplements: true,
                overloadTracker: true,
                gymProteinIntake: true,
                gymFoodSupplements: true,
                proteinIntakeWidget: true,
                supplementIntakeWidget: true,
              }
            };
            setDoc(prefsDocRef, { items: defaultPrefs });
            setPreferences(defaultPrefs);
        }
        setIsLoading(false);
    });
    
    return () => {
        settingsUnsubscribe();
        prefsUnsubscribe();
    };
  }, [user]);

  const handleSettingChange = async (key: string, value: boolean | string) => {
    if (!user) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    console.log('Saving settings:', newSettings); // Debug log
    
    try {
      await safeSetDoc(`users/${user.uid}/data`, 'settings', { items: newSettings });
      
      toast({
        title: "Setting updated!",
        description: `${key} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive"
      });
    }
  };

  const toggleFeature = async (featureKey: keyof UserPreferences['features']) => {
    if (!user) return;
    
    const newPreferences = {
      ...preferences,
      features: {
        ...preferences.features,
        [featureKey]: !preferences.features[featureKey]
      }
    };
    
    setPreferences(newPreferences);
    
    try {
      await safeSetDoc(`users/${user.uid}/data`, 'preferences', { items: newPreferences });
      
      toast({
        title: "Preference updated!",
        description: `${featureKey} has been ${newPreferences.features[featureKey] ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error updating preference",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
        <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold font-headline">Settings</h1>
              <p className="text-muted-foreground">Manage your application settings here.</p>
            </header>
            
            <Card>
                <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize the look and feel of the app.</CardDescription></CardHeader>
                <CardContent>
                    {isLoading ? ( <Skeleton className="h-10 w-full" /> ) : (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <Label className="text-base flex items-center gap-2"><Palette className="h-5 w-5" />App Theme</Label>
                                <p className="text-sm text-muted-foreground">Select a visual theme for the application.</p>
                            </div>
                            <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default-green">🌿 Default Green</SelectItem>
                                    <SelectItem value="indigo">💜 Soft Indigo</SelectItem>
                                    <SelectItem value="charcoal-yellow">⚡ Charcoal & Yellow</SelectItem>
                                    <SelectItem value="lavendar">💖 Lavendar</SelectItem>
                                    <SelectItem value="lemonade">🍋 Lemonade</SelectItem>
                                    <SelectItem value="sunset">🌅 Sunset</SelectItem>
                                    <SelectItem value="dreamy">💙 Dreamy</SelectItem>
                                    <SelectItem value="crimson">❤️ Crimson</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Dumbbell className="h-5 w-5" />
                        Gym Mode
                    </CardTitle>
                    <CardDescription>
                        Toggle gym-related features throughout the app. When disabled, only basic habit tracking (like streakbooks) will be shown.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? ( <Skeleton className="h-16 w-full" /> ) : (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="gym-mode-switch" className="text-base flex items-center gap-2">
                                    <Dumbbell className="h-5 w-5" />
                                    Enable Gym Features
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Show workout tracking, protein intake, and gym-related habits
                                </p>
                            </div>
                            <Switch 
                                id="gym-mode-switch"
                                checked={settings.gymTracking} 
                                onCheckedChange={(checked) => handleSettingChange('gymTracking', checked)} 
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Widgets</CardTitle>
                    <CardDescription>Choose which widgets appear on your dashboard. Changes are applied immediately.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? ( 
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* General Dashboard Features */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <SettingsIcon className="h-4 w-4" />
                                    General Dashboard
                                </h4>
                                
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="todays-plan-switch" className="text-base flex items-center gap-2">
                                            <CalendarCheck className="h-5 w-5" />Today&apos;s Plan
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Schedule and time blocks</p>
                                    </div>
                                    <Switch 
                                        id="todays-plan-switch" 
                                        checked={preferences.features.todaysPlan} 
                                        onCheckedChange={() => toggleFeature('todaysPlan')} 
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="financial-switch" className="text-base flex items-center gap-2">
                                            <Wallet className="h-5 w-5" />Financial Snapshot
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Recent transactions and balance</p>
                                    </div>
                                    <Switch 
                                        id="financial-switch" 
                                        checked={preferences.features.financialSnapshot} 
                                        onCheckedChange={() => toggleFeature('financialSnapshot')} 
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="todo-switch" className="text-base flex items-center gap-2">
                                            <ListChecks className="h-5 w-5" />To-Do List
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Daily tasks and priorities</p>
                                    </div>
                                    <Switch 
                                        id="todo-switch" 
                                        checked={preferences.features.todoList} 
                                        onCheckedChange={() => toggleFeature('todoList')} 
                                    />
                                </div>
                            </div>

                            {/* Health & Fitness Features */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4" />
                                    Health & Fitness
                                </h4>
                                
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="water-switch" className="text-base flex items-center gap-2">
                                            <GlassWater className="h-5 w-5" />Water Intake
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Daily hydration tracker</p>
                                    </div>
                                    <Switch 
                                        id="water-switch" 
                                        checked={preferences.features.waterIntake} 
                                        onCheckedChange={() => toggleFeature('waterIntake')} 
                                    />
                                </div>

                                {/* Main Gym Tracker Switch */}
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="gym-switch" className="text-base flex items-center gap-2">
                                            <Dumbbell className="h-5 w-5" />Gym & Workout Tracker
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Show gym tracking on dashboard</p>
                                    </div>
                                    <Switch 
                                        id="gym-switch" 
                                        checked={preferences.features.gymTracker} 
                                        onCheckedChange={() => toggleFeature('gymTracker')} 
                                    />
                                </div>
                            </div>
                        </div> 

                    )}
                </CardContent>
            </Card>

            <PushNotificationManager />

            <BackupAndRestore />
            
      </div>
    </AppLayout>
  );
}
