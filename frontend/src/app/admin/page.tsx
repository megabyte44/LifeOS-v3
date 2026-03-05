'use client';

import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { 
  Users, 
  Shield
} from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, loading } = useAdminCheck();

  // Only User Management is enabled
  const adminCards = [
    {
      title: 'User Management',
      description: 'View all users, statistics, and activity',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    }
    // Other admin features are disabled for now
    // Uncomment to enable when needed:
    // {
    //   title: 'AI Configuration',
    //   description: 'Manage AI models and system instructions',
    //   icon: Bot,
    //   href: '/admin/ai-config',
    //   color: 'text-purple-500',
    //   bgColor: 'bg-purple-50 dark:bg-purple-950'
    // },
    // {
    //   title: 'System Settings',
    //   description: 'Enable/disable features and configure limits',
    //   icon: Settings,
    //   href: '/admin/system-settings',
    //   color: 'text-orange-500',
    //   bgColor: 'bg-orange-50 dark:bg-orange-950'
    // },
    // {
    //   title: 'Announcements',
    //   description: 'Create and manage app updates & announcements',
    //   icon: Megaphone,
    //   href: '/admin/announcements',
    //   color: 'text-green-500',
    //   bgColor: 'bg-green-50 dark:bg-green-950'
    // },
    // {
    //   title: 'About Page',
    //   description: 'Manage About page content and information',
    //   icon: Info,
    //   href: '/admin/about',
    //   color: 'text-cyan-500',
    //   bgColor: 'bg-cyan-50 dark:bg-cyan-950'
    // }
  ];

  if (!loading && !isAdmin) {
    return null; // Hook will redirect
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
            <p className="text-muted-foreground mt-1">
              Manage SmartLifeOS users and settings
            </p>
          </div>
        </div>

        {/* Admin Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-2`}>
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
