'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Cloud, CloudOff, RefreshCw, Check, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QueueSyncIndicatorProps {
  queueLength: number;
  isSyncing: boolean;
  isOnline: boolean;
}

export function QueueSyncIndicator({ queueLength, isSyncing, isOnline }: QueueSyncIndicatorProps) {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const handleQueueSynced = (event: CustomEvent) => {
      setLastSyncTime(new Date());
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    };

    window.addEventListener('queue-synced', handleQueueSynced as EventListener);
    return () => {
      window.removeEventListener('queue-synced', handleQueueSynced as EventListener);
    };
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-2 relative",
            !isOnline && "opacity-40 hover:opacity-60"
          )}
        >
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          ) : isOnline ? (
            showSuccess ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Cloud className="h-4 w-4" />
            )
          ) : (
            <Cloud className="h-4 w-4 text-muted-foreground" />
          )}
          
          {queueLength > 0 && (
            <Badge 
              variant="secondary" 
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                !isOnline && "bg-orange-500 text-white"
              )}
            >
              {queueLength}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Sync Status</h4>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>

          {!isOnline && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CloudOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="font-semibold text-sm text-orange-700 dark:text-orange-400">
                  You're Offline
                </p>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-500">
                Don't worry! Your changes are saved locally and will sync automatically when you reconnect.
              </p>
            </div>
          )}

          {queueLength > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {queueLength} pending {queueLength === 1 ? 'change' : 'changes'}
                </span>
              </div>

              {isOnline && isSyncing && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Syncing changes...</span>
                </div>
              )}
            </div>
          ) : (
            isOnline && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  <span>All changes synced</span>
                </div>

                {lastSyncTime && (
                  <p className="text-xs text-muted-foreground">
                    Last synced: {lastSyncTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )
          )}

          <div className="pt-2 border-t space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={cn(
                "h-2 w-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500"
              )} />
              <span>
                {isOnline 
                  ? "Changes sync automatically" 
                  : "Changes saved locally"
                }
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Firestore offline persistence enabled
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
