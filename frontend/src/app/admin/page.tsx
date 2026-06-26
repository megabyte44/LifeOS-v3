'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { useAdminDashboard } from '@/hooks/api';
import {
  Users,
  Shield,
  BarChart3,
  Bot,
  Settings,
  Megaphone,
  Info,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, loading } = useAdminCheck();
  const { stats } = useAdminDashboard();

  const adminCards = [
    {
      title: 'User Management',
      description: 'View all users, statistics, and activity',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Analytics',
      description: 'AI usage trends, daily message volume, and top active users',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    },
    {
      title: 'AI Configuration',
      description: 'Manage AI models, API keys, and system instructions',
      icon: Bot,
      href: '/admin/ai-config',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'System Settings',
      description: 'Enable/disable features and configure usage limits',
      icon: Settings,
      href: '/admin/system-settings',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: 'Announcements',
      description: 'Create and manage app updates & announcements',
      icon: Megaphone,
      href: '/admin/announcements',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'RAG Evaluation',
      description: 'LLM-as-judge quality metrics: Faithfulness, Relevancy, Context Precision',
      icon: BarChart3,
      href: '/admin/rag-evaluation',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: 'About Page',
      description: 'Manage About page content and feature highlights',
      icon: Info,
      href: '/admin/about',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    },
  ];

  if (!loading && !isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      ) : (
        <div className="container mx-auto p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Manage SmartLifeOS users and settings</p>
            </div>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total AI Messages</CardDescription>
                  <CardTitle className="text-3xl">{stats.totalAiMessages}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Admin Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div
                        className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}
                      >
                        <Icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                      <CardTitle>{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="w-full">
                        Open →
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
