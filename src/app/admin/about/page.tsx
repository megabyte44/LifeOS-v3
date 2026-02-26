'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AboutPageContent } from '@/types';
import { Info, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_CONTENT: AboutPageContent = {
  title: 'About LifeOS',
  description: 'LifeOS is your all-in-one personal life management platform. Track your habits, manage finances, plan your days, and stay organized—all in one beautiful, intuitive app.',
  version: '2.0.0',
  markdownContent: '',
  features: [
    {
      icon: '📝',
      title: 'Smart Notes',
      description: 'Capture ideas and organize thoughts with rich text notes'
    },
    {
      icon: '✅',
      title: 'Task Management',
      description: 'Stay on top of your todos with intelligent task tracking'
    },
    {
      icon: '💪',
      title: 'Fitness Tracking',
      description: 'Monitor workouts, water intake, and protein consumption'
    },
    {
      icon: '💰',
      title: 'Finance Manager',
      description: 'Track expenses, set budgets, and achieve financial goals'
    },
    {
      icon: '🤖',
      title: 'AI Assistant',
      description: 'Get personalized insights powered by advanced AI'
    },
    {
      icon: '🔒',
      title: 'Password Vault',
      description: 'Securely store credentials and sensitive information'
    }
  ],
  contact: {
    email: 'support@lifeos.app',
    phone: '',
    website: '',
    github: 'https://github.com/yourusername/lifeos',
    twitter: 'https://twitter.com/lifeos'
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

export default function AboutPageManagerPage() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  const [content, setContent] = useState<AboutPageContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) return;
    loadContent();
  }, [user, isAdmin, adminLoading]);

  async function loadContent() {
    if (!user) return;
    
    try {
      // Mock data loading
      setTimeout(() => {
        setContent(DEFAULT_CONTENT);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading about content:', error);
      toast({
        title: "Error",
        description: "Failed to load content",
        variant: "destructive"
      });
      setLoading(false);
    }
  }

  async function saveContent() {
    if (!user) return;
    
    setSaving(true);
    try {
      const updatedContent = {
        ...content,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      };
      
      // Mock save
      console.log('Saving about content:', updatedContent);
      
      setContent(updatedContent);
      toast({
        title: "Success",
        description: "About page content saved!"
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }

  function addFeature() {
    setContent({
      ...content,
      features: [
        ...content.features,
        { icon: '✨', title: 'New Feature', description: 'Feature description' }
      ]
    });
  }

  function updateFeature(index: number, field: keyof typeof content.features[0], value: string) {
    const newFeatures = [...content.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setContent({ ...content, features: newFeatures });
  }

  function deleteFeature(index: number) {
    setContent({
      ...content,
      features: content.features.filter((_, i) => i !== index)
    });
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
              <Info className="w-8 h-8" />
              About Page Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage content displayed on the About page
            </p>
          </div>
          <Button onClick={saveContent} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Main details about the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={content.title}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="About LifeOS"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={content.description}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                rows={4}
                placeholder="Application description..."
              />
            </div>

            <div className="space-y-2">
              <Label>Version</Label>
              <Input
                value={content.version}
                onChange={(e) => setContent({ ...content, version: e.target.value })}
                placeholder="2.0.0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Markdown Content */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Markdown Content</CardTitle>
            <CardDescription>
              Optional: Paste your own markdown content here. If provided, this will be displayed instead of the features list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              value={content.markdownContent || ''}
              onChange={(e) => setContent({ ...content, markdownContent: e.target.value })}
              rows={15}
              className="font-mono text-sm"
              placeholder="# Your Custom Content&#10;&#10;Paste your markdown content here...&#10;&#10;**Features:**&#10;- Feature 1&#10;- Feature 2"
            />
            <p className="text-xs text-muted-foreground">
              💡 Leave empty to use the features list below instead. Markdown supports headers, lists, bold, italic, links, and more.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Features List</CardTitle>
                <CardDescription>Highlight key features of the app (used only if markdown content is empty)</CardDescription>
              </div>
              <Button onClick={addFeature} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.features.map((feature, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Feature {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFeature(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Icon (Emoji)</Label>
                    <Input
                      value={feature.icon}
                      onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                      placeholder="📝"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Title</Label>
                    <Input
                      value={feature.title}
                      onChange={(e) => updateFeature(index, 'title', e.target.value)}
                      placeholder="Feature title"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    value={feature.description}
                    onChange={(e) => updateFeature(index, 'description', e.target.value)}
                    rows={2}
                    placeholder="Feature description..."
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Social links and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={content.contact.email}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, email: e.target.value }
                })}
                placeholder="support@lifeos.app"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input
                type="tel"
                value={content.contact.phone || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, phone: e.target.value }
                })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label>Personal Website (optional)</Label>
              <Input
                type="url"
                value={content.contact.website || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, website: e.target.value }
                })}
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="space-y-2">
              <Label>GitHub URL (optional)</Label>
              <Input
                value={content.contact.github || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, github: e.target.value }
                })}
                placeholder="https://github.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label>Twitter URL (optional)</Label>
              <Input
                value={content.contact.twitter || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, twitter: e.target.value }
                })}
                placeholder="https://twitter.com/..."
              />
            </div>
          </CardContent>
        </Card>

        {content.updatedAt && (
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(content.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
