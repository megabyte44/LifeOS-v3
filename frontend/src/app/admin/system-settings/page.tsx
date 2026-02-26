'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SystemSettings } from '@/types';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_SETTINGS: SystemSettings = {
  features: {
    aiChat: true,
    pushNotifications: true,
    waterTracker: true,
    gymTracker: true,
    passwordManager: true,
    budgetTracker: true,
    habitTracker: true,
    planner: true,
  },
  maintenance: {
    enabled: false,
    message: 'LifeOS is currently under maintenance. We\'ll be back soon!'
  },
  limits: {
    maxNotesPerUser: 1000,
    maxTodosPerUser: 500,
    maxAiMessagesPerDay: 100
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

export default function SystemSettingsPage() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) return;
    loadSettings();
  }, [user, isAdmin, adminLoading]);

  async function loadSettings() {
    if (!user) return;
    
    try {
      // Mock data loading
      setTimeout(() => {
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!user) return;
    
    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      };
      
      // Mock save
      console.log('Saving system settings:', updatedSettings);
      
      setSettings(updatedSettings);
      toast({
        title: "Success",
        description: "Settings saved successfully!"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  if (adminLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8" />
              System Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage features, limits, and maintenance mode
            </p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Maintenance Mode */}
        <Card className={settings.maintenance.enabled ? 'border-orange-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={settings.maintenance.enabled ? 'text-orange-500' : ''} />
              Maintenance Mode
            </CardTitle>
            <CardDescription>
              When enabled, users will see a maintenance message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Enable Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Temporarily disable app access</p>
              </div>
              <Switch
                checked={settings.maintenance.enabled}
                onCheckedChange={(checked) => setSettings({
                  ...settings,
                  maintenance: { ...settings.maintenance, enabled: checked }
                })}
              />
            </div>

            {settings.maintenance.enabled && (
              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Textarea
                  value={settings.maintenance.message}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenance: { ...settings.maintenance, message: e.target.value }
                  })}
                  rows={3}
                  placeholder="Message to display to users..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>Enable or disable specific features for all users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(settings.features).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                </div>
                <Switch
                  checked={value as boolean}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    features: { ...settings.features, [key]: checked }
                  })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Usage Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>Set maximum limits per user to manage resources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Max Notes Per User</Label>
              <Input
                type="number"
                min="1"
                value={settings.limits.maxNotesPerUser}
                onChange={(e) => setSettings({
                  ...settings,
                  limits: { ...settings.limits, maxNotesPerUser: parseInt(e.target.value) || 1000 }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Todos Per User</Label>
              <Input
                type="number"
                min="1"
                value={settings.limits.maxTodosPerUser}
                onChange={(e) => setSettings({
                  ...settings,
                  limits: { ...settings.limits, maxTodosPerUser: parseInt(e.target.value) || 500 }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max AI Messages Per Day</Label>
              <Input
                type="number"
                min="1"
                value={settings.limits.maxAiMessagesPerDay}
                onChange={(e) => setSettings({
                  ...settings,
                  limits: { ...settings.limits, maxAiMessagesPerDay: parseInt(e.target.value) || 100 }
                })}
              />
              <p className="text-xs text-muted-foreground">
                Prevents API abuse and manages costs
              </p>
            </div>
          </CardContent>
        </Card>

        {settings.updatedAt && (
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
