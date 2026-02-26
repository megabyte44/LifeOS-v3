'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useAdminCheck } from '@/hooks/use-admin-check';
import { UserStats } from '@/types';
import { Users, Search, RefreshCw, Download, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UsersManagementPage() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'email' | 'lastLogin' | 'mostActive'>('newest');
  const [stats, setStats] = useState({
    total: 0,
    activeToday: 0,
    activeThisWeek: 0,
    activeThisMonth: 0
  });

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin, adminLoading]);

  async function loadUsers() {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  function exportUsers() {
    const csv = [
      ['Email', 'Display Name', 'Created At', 'Last Login', 'Notes', 'Todos', 'Habits', 'Transactions', 'AI Messages'].join(','),
      ...filteredAndSortedUsers.map(u => [
        u.email,
        u.displayName || '',
        new Date(u.createdAt).toLocaleDateString(),
        new Date(u.lastLoginAt).toLocaleDateString(),
        u.notesCount,
        u.todosCount,
        u.habitsCount,
        u.transactionsCount,
        u.aiMessagesCount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const filteredAndSortedUsers = users
    .filter(u => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'email':
          return a.email.localeCompare(b.email);
        case 'lastLogin':
          return new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime();
        case 'mostActive':
          const aActivity = (a.notesCount || 0) + (a.todosCount || 0) + (a.habitsCount || 0) + (a.transactionsCount || 0) + (a.aiMessagesCount || 0);
          const bActivity = (b.notesCount || 0) + (b.todosCount || 0) + (b.habitsCount || 0) + (b.transactionsCount || 0) + (b.aiMessagesCount || 0);
          return bActivity - aActivity;
        default:
          return 0;
      }
    });

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
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all registered users
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportUsers}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Today</CardDescription>
              <CardTitle className="text-3xl text-green-500">{stats.activeToday}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active This Week</CardDescription>
              <CardTitle className="text-3xl text-blue-500">{stats.activeThisWeek}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active This Month</CardDescription>
              <CardTitle className="text-3xl text-purple-500">{stats.activeThisMonth}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Sort */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredAndSortedUsers.length})</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'email' | 'lastLogin' | 'mostActive') => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="email">Email (A-Z)</SelectItem>
                  <SelectItem value="lastLogin">Last Login</SelectItem>
                  <SelectItem value="mostActive">Most Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Notes</TableHead>
                      <TableHead className="text-right">Todos</TableHead>
                      <TableHead className="text-right">Habits</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">AI Messages</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedUsers.map((u) => (
                        <TableRow key={u.uid}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{u.email}</span>
                              {u.displayName && (
                                <span className="text-sm text-muted-foreground">{u.displayName}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            <Badge variant={
                              new Date(u.lastLoginAt).getTime() > Date.now() - 86400000 ? 'default' : 'secondary'
                            }>
                              {new Date(u.lastLoginAt).toLocaleDateString()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{u.notesCount}</TableCell>
                          <TableCell className="text-right">{u.todosCount}</TableCell>
                          <TableCell className="text-right">{u.habitsCount}</TableCell>
                          <TableCell className="text-right">{u.transactionsCount}</TableCell>
                          <TableCell className="text-right">{u.aiMessagesCount}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
