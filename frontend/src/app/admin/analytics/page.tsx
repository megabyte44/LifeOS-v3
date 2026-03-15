'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { useAdminAnalytics } from '@/hooks/api';
import { TrendingUp, ArrowLeft, Users } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [days, setDays] = useState<7 | 14 | 30>(30);
  const { analytics, isLoading } = useAdminAnalytics(days);
  const loading = adminLoading || isLoading;

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

  const mostActiveDay =
    analytics && analytics.dailyMessages.length > 0
      ? analytics.dailyMessages.reduce((max, d) => (d.count > max.count ? d : max), {
          date: '-',
          count: 0,
        }).date
      : '-';

  return (
    <AppLayout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-8 h-8" />
              AI Usage Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Message trends, daily volume, and top active users
            </p>
          </div>
        </div>

        {/* Days Toggle */}
        <div className="flex gap-2">
          {([7, 14, 30] as const).map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Messages ({days}d)</CardDescription>
              <CardTitle className="text-3xl">{analytics?.totalMessages ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Per Day</CardDescription>
              <CardTitle className="text-3xl">
                {analytics ? analytics.avgPerDay.toFixed(1) : '0.0'}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Most Active Day</CardDescription>
              <CardTitle className="text-xl font-mono">{mostActiveDay}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Line Chart: Messages Per Day */}
        <Card>
          <CardHeader>
            <CardTitle>Messages Per Day</CardTitle>
            <CardDescription>Daily AI message volume over the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && analytics.dailyMessages.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics.dailyMessages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name="Messages"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No message data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart: Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Users by Message Count
            </CardTitle>
            <CardDescription>Most active users in the last {days} days</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics && analytics.topUsers.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(260, analytics.topUsers.length * 36)}>
                <BarChart data={analytics.topUsers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="email"
                    width={200}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [value, 'Messages']}
                    labelFormatter={(label) => `User: ${label}`}
                  />
                  <Bar dataKey="count" fill="#6366f1" name="Messages" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No user data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Users Table */}
        {analytics && analytics.topUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Users Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.topUsers.map((u, i) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
                        {i + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{u.email}</p>
                        {u.displayName && (
                          <p className="text-xs text-muted-foreground">{u.displayName}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">{u.count} messages</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
