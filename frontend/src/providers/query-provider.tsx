'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect, type ReactNode } from 'react';
import { startConnectionLogger } from '@/lib/connection-logger';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 2 minutes — no network calls during this window
        staleTime: 2 * 60 * 1000,
        // Cache unused data for 5 minutes after components unmount
        gcTime: 5 * 60 * 1000,
        // Only retry once; never retry on network errors (won't fix themselves)
        retry: (failureCount, error) => {
          if (failureCount >= 1) return false;
          if (error instanceof TypeError) return false; // network error / CORS
          if (error instanceof DOMException && error.name === 'TimeoutError') return false;
          return true;
        },
        // Refetch stale queries when the tab gains focus (catches background changes)
        refetchOnWindowFocus: false,
        // Don't crash the component tree on query errors — let error.tsx handle it
        throwOnError: false,
      },
      mutations: {
        retry: 0,
        // Don't crash on mutation errors — callers handle them via onError / catch
        throwOnError: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  // Start backend + DB connection polling on first render (browser only)
  useEffect(() => { startConnectionLogger(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
