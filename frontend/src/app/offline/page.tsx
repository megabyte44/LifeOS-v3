'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCcw, Home, CheckCircle } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/dashboard');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className={`rounded-full p-6 ${isOnline ? 'bg-green-100' : 'bg-red-100'} transition-colors duration-300`}>
              {isOnline ? (
                <CheckCircle className="h-16 w-16 text-green-600 animate-pulse" />
              ) : (
                <WifiOff className="h-16 w-16 text-red-600" />
              )}
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {isOnline ? "You're Back Online!" : "You're Offline"}
          </CardTitle>
          
          <CardDescription className="text-base">
            {isOnline 
              ? "Connection restored. Redirecting you back..."
              : "No internet connection detected. Some features may be limited, but you can still view cached content."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isOnline && (
            <>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">Available Offline:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• View cached dashboard</li>
                  <li>• Browse previously loaded content</li>
                  <li>• Access saved notes</li>
                  <li>• Review your habits and goals</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleRetry} 
                  className="w-full"
                  size="lg"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>

                <Button 
                  onClick={() => router.push('/dashboard')} 
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard (Cached)
                </Button>
              </div>
            </>
          )}

          {isOnline && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-green-600 font-medium">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                Redirecting...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
