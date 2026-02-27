'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';
import { useAuth } from '@/hooks/use-auth';

/**
 * Hook to check if the current user has admin privileges.
 *
 * Previously referenced in admin pages but was never implemented.
 * In mock mode, this always returns { isAdmin: true }.
 * In real mode, it calls GET /api/admin/check which verifies the
 * Firebase ID token against the backend user-roles table.
 */
export function useAdminCheck() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['admin', 'check'],
    queryFn: () => adminService.checkAdmin(),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // Cache admin status for 5 minutes
    retry: 1,
  });

  return {
    isAdmin: query.data?.isAdmin ?? false,
    loading: authLoading || query.isLoading,
    error: query.error,
  };
}
