'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
// Single Firebase instance shared across the app — no duplicate init
import { auth, googleProvider } from '@/lib/firebase';


export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  /** True while the Google sign-in popup is in-flight (before onAuthStateChanged fires). */
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSigningIn: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);
export type { FirebaseUser as User };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Failsafe: if Firebase never responds, stop showing the spinner after 8s
    const timeout = setTimeout(() => setLoading(false), 8000);

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      clearTimeout(timeout);
      setUser(authUser);
      setLoading(false);
      // Clear the sign-in flag whenever auth state settles
      setIsSigningIn(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      throw new Error('Firebase configuration is missing.');
    }

    // Mark as signing-in so AppLayout doesn't redirect to /login while the
    // popup is open (the window where loading=false && user=null is true).
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will fire and clear isSigningIn
    } catch (error) {
      console.error('Error signing in with Google', error);
      setIsSigningIn(false);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) {
      router.push('/login');
      return;
    }

    // Clear all cached query data so the next user starts with a clean slate
    queryClient.clear();
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isSigningIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
