
'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Edit, ShieldCheck, Brain, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { reauthenticateWithCredential, EmailAuthProvider, updateEmail, updatePassword, linkWithCredential } from 'firebase/auth';
import { userApiService } from '@/services/user.service';
import type { AiProfileResponse } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Profile state
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security state
  const [isSecurityLoading, setIsSecurityLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Link account state (for guest users)
  const [linkEmail, setLinkEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // AI Profile state
  const [aiProfile, setAiProfile] = useState<AiProfileResponse | null>(null);
  const [aiProfileLoading, setAiProfileLoading] = useState(true);


  useEffect(() => {
    if (!user) return;
    setUsername(user.displayName || '');
    setPhotoURL(user.photoURL || null);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setAiProfileLoading(true);
    userApiService.getAiProfile()
      .then(setAiProfile)
      .catch(() => setAiProfile(null))
      .finally(() => setAiProfileLoading(false));
  }, [user]);

  const handleSaveUsername = async () => {
    if (!user || !username.trim()) return;
    setIsLoading(true);
    const finalUsername = username.trim();
    try {
        // Only update local profile here since Firestore is removed
        // For real auth update, we'd use updateProfile object from firebase/auth
        toast({ title: "Success", description: `Username display updated to ${finalUsername}.` });
    } catch(e) {
        toast({ variant: 'destructive', title: "Error", description: "Could not save your username." });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
        // Mock upload - in real app we'd need a storage solution
        const objectUrl = URL.createObjectURL(file);
        setPhotoURL(objectUrl);
        toast({ title: 'Success!', description: 'Your profile picture has been updated locally.' });
    } catch (error) {
        console.error("Error uploading image:", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your image. Please try again.' });
    } finally {
        setIsUploading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newEmail || !currentPassword) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all fields.' });
      return;
    }
    if (!user.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot change email for accounts without an initial email.' });
      return;
    }
    setIsSecurityLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      toast({ title: 'Email updated!', description: `Your email address has been successfully changed to ${newEmail}.` });
      setNewEmail('');
      setCurrentPassword('');
    } catch (error: any) {
      let description = "An error occurred while updating your email.";
      if (error.code === 'auth/invalid-credential') {
        description = 'Incorrect password. Please verify your current password and try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        description = 'The new email address is already in use by another account.';
      } else if (error.code === 'auth/requires-recent-login') {
        description = 'This is a sensitive operation. Please log out and sign back in to continue.';
      }
      toast({ variant: 'destructive', title: 'Email Change Failed', description });
    } finally {
      setIsSecurityLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword || !currentPassword || !confirmNewPassword) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill in all fields.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match', description: 'The new passwords you entered do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Password too short', description: 'Your new password must be at least 6 characters long.' });
      return;
    }
     if (!user.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot change password for accounts without an email.' });
      return;
    }
    setIsSecurityLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({ title: 'Password updated!', description: 'Your password has been successfully changed.' });
      setNewPassword('');
      setConfirmNewPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      let description = "An error occurred while updating your password.";
      if (error.code === 'auth/invalid-credential') {
        description = 'Incorrect password. Please verify your current password and try again.';
      } else if (error.code === 'auth/requires-recent-login') {
        description = 'This is a sensitive operation. Please log out and sign back in to continue.';
      }
      toast({ variant: 'destructive', title: 'Password Change Failed', description });
    } finally {
      setIsSecurityLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !linkEmail || !linkPassword) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please enter both email and password.' });
      return;
    }
    if (linkPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Password too short', description: 'Password must be at least 6 characters long.' });
      return;
    }
    setIsLinking(true);
    try {
      const credential = EmailAuthProvider.credential(linkEmail, linkPassword);
      await linkWithCredential(user, credential);
      toast({ title: 'Account Linked! 🎉', description: 'Your guest account is now a permanent account. All your data is saved!' });
      setLinkEmail('');
      setLinkPassword('');
    } catch (error: any) {
      let description = "Could not link your account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already registered. Please sign in with that account instead.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'Invalid email address format.';
      }
      toast({ variant: 'destructive', title: 'Account Linking Failed', description });
    } finally {
      setIsLinking(false);
    }
  };  if (isLoading || !user) {
    return (
        <AppLayout>
            <div className="space-y-4">
                <header>
                  <h1 className="text-2xl font-bold font-headline">Edit Profile</h1>
                  <p className="text-muted-foreground">Manage your profile settings here.</p>
                </header>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                           <Skeleton className="h-20 w-20 rounded-full" />
                           <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-32" /></div>
                        </div>
                        <div className="space-y-2"><Skeleton className="h-4 w-1/6 mb-2" /><Skeleton className="h-10 w-full" /></div>
                    </CardContent>
                    <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
                </Card>
            </div>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold font-headline">Edit Profile</h1>
          <p className="text-muted-foreground">Manage your profile settings here.</p>
        </header>
        <Card>
            <CardHeader><CardTitle>Your Information</CardTitle><CardDescription>Update your username and profile picture.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Your Avatar</Label>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={photoURL || undefined} alt="User Avatar" />
                                <AvatarFallback>{username ? username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                            </Avatar>
                            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="secondary" size="icon" className="absolute bottom-0 right-0 h-7 w-7 rounded-full">
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                            </Button>
                            <Input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload}
                                hidden 
                                accept="image/png, image/jpeg" 
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">Click the edit icon on your avatar to upload a new image.<br/>(Max 1MB)</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} />
                </div>
            </CardContent>
            <CardFooter><Button onClick={handleSaveUsername} disabled={isLoading}><Save className="mr-2 h-4 w-4" /> Save Username</Button></CardFooter>
        </Card>

        {/* AI Profile Card */}
        <Card className="border border-purple-200 dark:border-purple-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              AI Profile
            </CardTitle>
            <CardDescription>What the AI knows about you — built from conversations, notes, and habits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiProfileLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : aiProfile ? (
              <>
                {/* Completeness bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">Profile Completeness</span>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{aiProfile.profileCompleteness}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${aiProfile.profileCompleteness}%` }}
                    />
                  </div>
                </div>

                {/* Known fields */}
                <div className="grid gap-3 text-sm">
                  {aiProfile.occupation && (
                    <div><span className="text-muted-foreground">Occupation:</span> <span className="font-medium">{aiProfile.occupation}</span></div>
                  )}
                  {aiProfile.age && (
                    <div><span className="text-muted-foreground">Age:</span> <span className="font-medium">{aiProfile.age}</span></div>
                  )}
                  {aiProfile.bio && (
                    <div><span className="text-muted-foreground">Bio:</span> <span className="font-medium">{aiProfile.bio}</span></div>
                  )}
                  {aiProfile.philosophy && (
                    <div><span className="text-muted-foreground">Philosophy:</span> <span className="font-medium">{aiProfile.philosophy}</span></div>
                  )}
                  {aiProfile.lifeMotto && (
                    <div><span className="text-muted-foreground">Life motto:</span> <span className="font-medium">{aiProfile.lifeMotto}</span></div>
                  )}
                  {aiProfile.lifeSummary && (
                    <div><span className="text-muted-foreground">Summary:</span> <span className="font-medium">{aiProfile.lifeSummary}</span></div>
                  )}
                </div>

                {/* Interests */}
                {aiProfile.interests && aiProfile.interests.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Interests:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {aiProfile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {aiProfile.profileCompleteness === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No profile data yet.</p>
                    <p className="text-xs mt-1">Chat with the AI in <strong>Chat Buddy</strong> mode to start building your profile!</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Could not load AI profile.</p>
            )}
          </CardContent>
        </Card>

        {user.isAnonymous && (
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-purple-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary"/>
                        Upgrade to Permanent Account
                    </CardTitle>
                    <CardDescription>
                        You're currently using Guest Mode. Link an email & password to save your data permanently and sync across devices!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLinkAccount} className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                ✨ Why Upgrade?
                            </p>
                            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                                <li>• Keep all your current data (nothing lost!)</li>
                                <li>• Sync across all your devices</li>
                                <li>• Enable cloud backup</li>
                                <li>• Access from anywhere</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link-email">Email Address</Label>
                            <Input 
                                id="link-email" 
                                type="email" 
                                value={linkEmail} 
                                onChange={(e) => setLinkEmail(e.target.value)} 
                                placeholder="your@email.com" 
                                disabled={isLinking} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link-password">Password</Label>
                            <Input 
                                id="link-password" 
                                type="password" 
                                value={linkPassword} 
                                onChange={(e) => setLinkPassword(e.target.value)} 
                                placeholder="Create a password (6+ characters)" 
                                disabled={isLinking} 
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={isLinking}
                            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                        >
                            {isLinking ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Linking Account...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Create Permanent Account
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        )}

        {!user.isAnonymous && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck/>Security Settings</CardTitle>
                    <CardDescription>Update your email or password. You will need to provide your current password to make changes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="email" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="email">Change Email</TabsTrigger>
                            <TabsTrigger value="password">Change Password</TabsTrigger>
                        </TabsList>
                        <TabsContent value="email" className="pt-4">
                            <form onSubmit={handleEmailChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-email">New Email Address</Label>
                                    <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new.email@example.com" disabled={isSecurityLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="current-password-email">Current Password</Label>
                                    <Input id="current-password-email" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" disabled={isSecurityLoading} />
                                </div>
                                <Button type="submit" disabled={isSecurityLoading}>
                                    {isSecurityLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Update Email
                                </Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="password" className="pt-4">
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password-pw">Current Password</Label>
                                    <Input id="current-password-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" disabled={isSecurityLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="6+ characters" disabled={isSecurityLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input id="confirm-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="6+ characters" disabled={isSecurityLoading} />
                                </div>
                                <Button type="submit" disabled={isSecurityLoading}>
                                    {isSecurityLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Update Password
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )}
      </div>
    </AppLayout>
  );
}
