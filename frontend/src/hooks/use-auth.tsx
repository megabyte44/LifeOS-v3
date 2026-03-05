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
  GoogleAuthProvider,
  getAuth,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Initialize Firebase Auth
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


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

  useEffect(() => {
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
    // onAuthStateChanged will fire with null and set loading=false automatically.
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
