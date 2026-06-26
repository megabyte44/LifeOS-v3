'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle2, Database } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function AdminSetupPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-orange-500" />
            Admin Access Setup
          </h1>
          <p className="text-muted-foreground mt-1">
            Follow these steps to grant admin access
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Admin Access Required</AlertTitle>
          <AlertDescription>
            You need to manually add admin permissions to your account in Firestore.
          </AlertDescription>
        </Alert>

        {user && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-blue-700 dark:text-blue-300">Your Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>
                <span className="font-semibold">{user.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">UID: </span>
                <span className="font-semibold">{user.uid}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Step-by-Step Instructions
            </CardTitle>
            <CardDescription>Add admin flag to your Firestore user document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Open Firebase Console</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">console.firebase.google.com</a>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Select your <strong>LifeOS</strong> project
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Navigate to Firestore Database</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on <strong>"Firestore Database"</strong> in the left sidebar
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Find Your User Document</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Go to the <code className="bg-muted px-1 py-0.5 rounded">users</code> collection
                  </p>
                  {user && (
                    <p className="text-sm text-muted-foreground">
                      Look for document ID: <code className="bg-muted px-1 py-0.5 rounded">{user.uid}</code>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Add Admin Field</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">Click on your user document</p>
                    <p className="text-muted-foreground">Click the <strong>"Add field"</strong> button</p>
                    <div className="bg-muted p-3 rounded-lg space-y-1 font-mono text-xs">
                      <div><span className="text-muted-foreground">Field name:</span> <strong>isAdmin</strong></div>
                      <div><span className="text-muted-foreground">Field type:</span> <strong>boolean</strong></div>
                      <div><span className="text-muted-foreground">Value:</span> <strong className="text-green-600">true</strong></div>
                    </div>
                    <p className="text-muted-foreground">Click <strong>"Update"</strong></p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">Done! Refresh the Page</h3>
                  <p className="text-sm text-muted-foreground">
                    After adding the field, refresh this page. You'll be able to access <strong>/admin</strong>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alternative: Add Multiple Admins</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>To add more admin users, repeat the process above for each user's document.</p>
            <p className="mt-2">Just add <code className="bg-muted px-1 py-0.5 rounded">isAdmin: true</code> to their user document in the <code className="bg-muted px-1 py-0.5 rounded">users</code> collection.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
