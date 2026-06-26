'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AiConfiguration } from '@/types';
import { Bot, Save, RotateCcw, AlertCircle, Key, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAiConfig } from '@/hooks/api';

const DEFAULT_CONFIG: AiConfiguration = {
  systemInstructions: {
    casualBuddy: `You are a friendly and casual AI assistant for LifeOS.
Be warm, conversational, and supportive. Use emojis occasionally.
Help users manage their life, provide insights, and stay motivated.`,
    professionalAssistant: `You are a professional AI assistant for LifeOS.
Provide clear, structured, and actionable responses.
Focus on data-driven insights and practical recommendations.`
  },
  defaultPersonality: 'casual',
  modelConfig: {
    provider: 'openrouter',
    model: 'x-ai/grok-4-fast:free',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9
  },
  apiKeys: {
    openrouter: '',
    gemini: '',
    openai: ''
  },
  ragEnabled: true,
  insightsEnabled: false,
  insightsCron: '0 9 * * *',
  evaluationEnabled: false,
  evaluationSampleRate: 10,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

export default function AiConfigPage() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  const { config: apiConfig, isLoading: apiLoading, updateConfig: updateConfigApi } = useAdminAiConfig();
  const [config, setConfig] = useState<AiConfiguration>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const loading = adminLoading || apiLoading;
  const [showApiKeys, setShowApiKeys] = useState({
    openrouter: false,
    gemini: false,
    openai: false
  });

  useEffect(() => { if (apiConfig) setConfig(apiConfig); }, [apiConfig]);

  async function saveConfig() {
    setSaving(true);
    try {
      await updateConfigApi({ ...config, updatedAt: new Date().toISOString(), updatedBy: user?.uid || 'admin' });
      toast({ title: "Success", description: "Configuration saved! Changes take effect immediately." });
    } catch (error) {
      console.error('Error saving AI config:', error);
      toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    if (confirm('Reset to default settings?')) {
      setConfig(DEFAULT_CONFIG);
      toast({
        title: "Reset",
        description: "Configuration reset to defaults. Click Save to apply."
      });
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
              <Bot className="w-8 h-8" />
              AI Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage AI models and system instructions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveConfig} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Model Configuration</CardTitle>
            <CardDescription>Configure AI provider and model parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={config.modelConfig.provider}
                  onValueChange={(value: any) => setConfig({
                    ...config,
                    modelConfig: { ...config.modelConfig, provider: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={config.modelConfig.model}
                  onChange={(e) => setConfig({
                    ...config,
                    modelConfig: { ...config.modelConfig, model: e.target.value }
                  })}
                  placeholder="e.g., x-ai/grok-4-fast:free"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Embedding Model</Label>
              <Input
                value={config.modelConfig.embeddingModel || ''}
                onChange={(e) => setConfig({
                  ...config,
                  modelConfig: { ...config.modelConfig, embeddingModel: e.target.value }
                })}
                placeholder="e.g., openai/text-embedding-3-small"
              />
              <p className="text-xs text-muted-foreground">
                Model used for RAG vector embeddings. For OpenRouter, prefix with openai/ (e.g. openai/text-embedding-3-small).
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Temperature (0-2)</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.modelConfig.temperature}
                  onChange={(e) => setConfig({
                    ...config,
                    modelConfig: { ...config.modelConfig, temperature: parseFloat(e.target.value) }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  min="256"
                  max="4096"
                  step="256"
                  value={config.modelConfig.maxTokens}
                  onChange={(e) => setConfig({
                    ...config,
                    modelConfig: { ...config.modelConfig, maxTokens: parseInt(e.target.value) }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Top P (0-1)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.modelConfig.topP}
                  onChange={(e) => setConfig({
                    ...config,
                    modelConfig: { ...config.modelConfig, topP: parseFloat(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Enable RAG (Retrieval-Augmented Generation)</Label>
                <p className="text-sm text-muted-foreground">AI can access user's personal data</p>
              </div>
              <Switch
                checked={config.ragEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, ragEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys Management
            </CardTitle>
            <CardDescription>
              Store API keys securely in Firestore. Update them when they expire.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Security Note:</strong> API keys are stored in Firestore and will be used by the AI chat API route. 
                Keys stored here take priority over environment variables.
              </div>
            </div>

            {/* OpenRouter API Key */}
            <div className="space-y-2">
              <Label htmlFor="openrouter-key" className="flex items-center justify-between">
                <span>OpenRouter API Key</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowApiKeys(prev => ({ ...prev, openrouter: !prev.openrouter }))}
                >
                  {showApiKeys.openrouter ? (
                    <><EyeOff className="w-4 h-4 mr-1" /> Hide</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-1" /> Show</>
                  )}
                </Button>
              </Label>
              <Input
                id="openrouter-key"
                type={showApiKeys.openrouter ? "text" : "password"}
                value={config.apiKeys?.openrouter || ''}
                onChange={(e) => setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, openrouter: e.target.value }
                })}
                placeholder="sk-or-v1-..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">openrouter.ai/keys</a>
              </p>
            </div>

            {/* Gemini API Key */}
            <div className="space-y-2">
              <Label htmlFor="gemini-key" className="flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowApiKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                >
                  {showApiKeys.gemini ? (
                    <><EyeOff className="w-4 h-4 mr-1" /> Hide</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-1" /> Show</>
                  )}
                </Button>
              </Label>
              <Input
                id="gemini-key"
                type={showApiKeys.gemini ? "text" : "password"}
                value={config.apiKeys?.gemini || ''}
                onChange={(e) => setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, gemini: e.target.value }
                })}
                placeholder="AIza..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a>
              </p>
            </div>

            {/* OpenAI API Key */}
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="flex items-center justify-between">
                <span>OpenAI API Key</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowApiKeys(prev => ({ ...prev, openai: !prev.openai }))}
                >
                  {showApiKeys.openai ? (
                    <><EyeOff className="w-4 h-4 mr-1" /> Hide</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-1" /> Show</>
                  )}
                </Button>
              </Label>
              <Input
                id="openai-key"
                type={showApiKeys.openai ? "text" : "password"}
                value={config.apiKeys?.openai || ''}
                onChange={(e) => setConfig({
                  ...config,
                  apiKeys: { ...config.apiKeys, openai: e.target.value }
                })}
                placeholder="sk-..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI Platform</a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Casual Buddy Personality</CardTitle>
            <CardDescription>System instructions for casual mode</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.systemInstructions.casualBuddy}
              onChange={(e) => setConfig({
                ...config,
                systemInstructions: { ...config.systemInstructions, casualBuddy: e.target.value }
              })}
              rows={8}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Assistant Personality</CardTitle>
            <CardDescription>System instructions for professional mode</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={config.systemInstructions.professionalAssistant}
              onChange={(e) => setConfig({
                ...config,
                systemInstructions: { ...config.systemInstructions, professionalAssistant: e.target.value }
              })}
              rows={8}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation &amp; Evaluation</CardTitle>
            <CardDescription>Configure proactive insights scheduling and RAG evaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Enable Proactive Insights</Label>
                <p className="text-sm text-muted-foreground">Automatically generate daily life insights for users</p>
              </div>
              <Switch
                checked={config.insightsEnabled ?? false}
                onCheckedChange={(checked) => setConfig({ ...config, insightsEnabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Insights Schedule (Cron)</Label>
              <Input
                value={config.insightsCron ?? '0 9 * * *'}
                onChange={(e) => setConfig({ ...config, insightsCron: e.target.value })}
                placeholder="0 9 * * *"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Standard cron format. Default: 9:00 AM UTC daily.</p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Enable RAG Evaluation</Label>
                <p className="text-sm text-muted-foreground">Run LLM-as-judge evaluation on sampled responses</p>
              </div>
              <Switch
                checked={config.evaluationEnabled ?? false}
                onCheckedChange={(checked) => setConfig({ ...config, evaluationEnabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Evaluation Sample Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="5"
                value={config.evaluationSampleRate ?? 10}
                onChange={(e) => setConfig({ ...config, evaluationSampleRate: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Percentage of responses to evaluate. 0 = disabled, 100 = all.</p>
            </div>
          </CardContent>
        </Card>

        {config.updatedAt && (
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date(config.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </AppLayout>
  );
}
