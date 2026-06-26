import { Skeleton } from '@/components/ui/skeleton';

/**
 * Full-page loading skeleton that mirrors the AppLayout structure.
 * Used in route-level loading.tsx files to prevent blank screens during navigation.
 */
export function PageLoadingSkeleton() {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar skeleton */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-16 border-r bg-background/95 flex-col items-center py-4 gap-2 z-50">
        <Skeleton className="h-10 w-10 rounded-xl mb-4" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-12 rounded-xl" />
        ))}
      </div>

      <div className="md:ml-16 flex flex-col flex-1">
        {/* Header skeleton */}
        <div className="h-14 border-b bg-background/95 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-30">
          <Skeleton className="h-6 w-24" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4 md:p-6 pb-24 md:pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl hidden md:block" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>

      {/* Mobile bottom nav skeleton */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t bg-background/95 flex items-center justify-around px-4 z-40">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-10 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
