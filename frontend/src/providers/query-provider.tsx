'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 2 minutes
        staleTime: 2 * 60 * 1000,
        // Cache unused data for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Only retry once, and never retry on network/timeout errors (connection refused won't magically succeed)
        retry: (failureCount, error) => {
          if (failureCount >= 1) return false;
          if (error instanceof TypeError) return false; // network error / CORS
          if (error instanceof DOMException && error.name === 'TimeoutError') return false;
          return true;
        },
        // Don't refetch on every tab switch — staleTime already handles freshness
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
