import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services';
import type {
  AiConfiguration,
  SystemSettings,
  Announcement,
  AboutPageContent,
  UserStats,
  AdminDashboardStats,
  AdminAnalytics,
} from '@/types';
import { useAuth } from '@/hooks/use-auth';

const EMPTY_USERS: UserStats[] = [];
const EMPTY_ANNOUNCEMENTS: Announcement[] = [];

// ---------- Users ----------

export function useAdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.getUsers(),
    enabled: !!user,
  });

  const updateRole = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: string }) =>
      adminService.updateUserRole(uid, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return {
    users: query.data ?? EMPTY_USERS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateRole: updateRole.mutateAsync,
    isUpdatingRole: updateRole.isPending,
  };
}

// ---------- Dashboard ----------

export function useAdminDashboard() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.getDashboardStats(),
    enabled: !!user,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ---------- Analytics ----------

export function useAdminAnalytics(days: number) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['admin', 'analytics', days],
    queryFn: () => adminService.getAnalytics(days),
    enabled: !!user,
  });

  return {
    analytics: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

// ---------- AI Config ----------

export function useAdminAiConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'ai-config'],
    queryFn: () => adminService.getAiConfig(),
    enabled: !!user,
  });

  const updateConfig = useMutation({
    mutationFn: (config: Partial<AiConfiguration>) => adminService.updateAiConfig(config),
    onSuccess: (data) => queryClient.setQueryData(['admin', 'ai-config'], data),
  });

  return {
    config: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateConfig: updateConfig.mutateAsync,
    isUpdating: updateConfig.isPending,
  };
}

// ---------- System Settings ----------

export function useAdminSystemSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminService.getSystemSettings(),
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: (settings: Partial<SystemSettings>) =>
      adminService.updateSystemSettings(settings),
    onSuccess: (data) => queryClient.setQueryData(['admin', 'settings'], data),
  });

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateSettings: updateSettings.mutateAsync,
    isUpdating: updateSettings.isPending,
  };
}

// ---------- Announcements ----------

export function useAdminAnnouncements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const KEY = ['admin', 'announcements'];

  const query = useQuery({
    queryKey: KEY,
    queryFn: () => adminService.getAnnouncements(),
    enabled: !!user,
  });

  const createAnnouncement = useMutation({
    mutationFn: (ann: Omit<Announcement, 'id' | 'createdAt'>) =>
      adminService.createAnnouncement(ann),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  const updateAnnouncement = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Announcement> }) =>
      adminService.updateAnnouncement(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: string) => adminService.deleteAnnouncement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  return {
    announcements: query.data ?? EMPTY_ANNOUNCEMENTS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createAnnouncement: createAnnouncement.mutateAsync,
    updateAnnouncement: updateAnnouncement.mutateAsync,
    deleteAnnouncement: deleteAnnouncement.mutateAsync,
  };
}

// ---------- About ----------

export function useAdminAbout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin', 'about'],
    queryFn: () => adminService.getAboutContent(),
    enabled: !!user,
  });

  const updateContent = useMutation({
    mutationFn: (content: Partial<AboutPageContent>) =>
      adminService.updateAboutContent(content),
    onSuccess: (data) => queryClient.setQueryData(['admin', 'about'], data),
  });

  return {
    content: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateContent: updateContent.mutateAsync,
    isUpdating: updateContent.isPending,
  };
}
