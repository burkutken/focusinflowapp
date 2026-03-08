
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<string | null>;
  signUpWithEmail: (email: string, pass: string) => Promise<string | null>;
  forceTokenRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // User is logged in, check for premium status
        user.getIdTokenResult(true).then((idTokenResult) => {
          const isPremiumUser = !!idTokenResult.claims.isPremium;
          setIsPremium(isPremiumUser);
          if (isPremiumUser) {
            console.log("User has a premium account.");
          } else {
            console.log("User has a free account.");
          }
          setLoading(false);
        });
      } else {
        // User is logged out
        setIsPremium(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicPages = ["/", "/login", "/signup", "/terms", "/privacy", "/refund"];
    const isPublicPage = publicPages.some(page => pathname === page) || pathname.startsWith('/api/');

    const isAuthPage = pathname === "/login" || pathname === "/signup";
    
    if (!user && !isPublicPage) {
       router.replace("/login");
    } 
    else if (user && isAuthPage) {
      router.replace("/tasks");
    }
  }, [user, loading, router, pathname]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIsPremium(false);
    router.push("/login");
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return null;
    } catch(err: any) {
      return err.message;
    }
  }
  
  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      return null;
    } catch(err: any) {
       return err.message;
    }
  };

  const forceTokenRefresh = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("Forcing token refresh...");
      const idTokenResult = await currentUser.getIdTokenResult(true);
      const isPremiumUser = !!idTokenResult.claims.isPremium;
      setIsPremium(isPremiumUser);
      console.log("Token refreshed. Premium status:", isPremiumUser);
    }
  };

  const value = { user, loading, isPremium, signOut, signInWithEmail, signUpWithEmail, forceTokenRefresh };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
