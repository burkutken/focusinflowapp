
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, confirmPasswordReset as firebaseConfirmPasswordReset, sendEmailVerification, applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { findUserByNickname as callFindUserByNickname, setUserProfile as callSetUserProfile } from "@/lib/actions";
import { doc, onSnapshot, getFirestore, setDoc } from "firebase/firestore";
import { useToast } from "./use-toast";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isPremium: boolean;
  isLifetime: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (emailOrNickname: string, pass: string) => Promise<string | null>;
  signUpWithEmail: (email: string, pass: string, nickname: string) => Promise<string | null>;
  forceTokenRefresh: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<string | null>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<string | null>;
  handleVerifyEmail: (actionCode: string) => Promise<string | null>;
  saveUserProfile: (nickname: string, aiApiKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLifetime, setIsLifetime] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          setIsPremium(!!idTokenResult.claims.isPremium);
          setIsLifetime(!!idTokenResult.claims.isLifetime);
        } catch (error) {
          console.error("Error fetching user claims:", error);
          setIsPremium(false);
          setIsLifetime(false);
        }
      } else {
        setIsPremium(false);
        setIsLifetime(false);
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const db = getFirestore(auth.app);
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const publicPages = ["/", "/login", "/signup", "/terms", "/privacy", "/refund", "/forgot-password", "/reset-password", "/verify-email", "/payments"];
    const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/api/');
    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (!user && !isPublicPage) {
       router.replace("/login");
    } else if (user && isAuthPage) {
      router.replace("/tasks");
    }
  }, [user, loading, router, pathname]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    router.push("/login");
  };

  const signInWithEmail = async (emailOrNickname: string, pass: string) => {
    setLoading(true);
    let email = emailOrNickname;
    
    if (!emailOrNickname.includes('@')) {
        const result = await callFindUserByNickname(emailOrNickname);
        if (result.error || !result.data) {
            setLoading(false);
            return result.error || "User not found with that nickname.";
        }
        email = result.data.email;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setLoading(false);
      return null;
    } catch(err: any) {
      setLoading(false);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        return "Invalid credentials. Please check your email/nickname and password.";
      }
       if (err.code === 'auth/user-not-verified') {
        return 'Your email has not been verified. Please check your inbox for a verification link.';
      }
      return err.message;
    }
  }
  
  const signUpWithEmail = async (email: string, pass: string, nickname: string) => {
    setLoading(true);
    
    try {
        // First check if nickname is available to prevent creating an auth user unnecessarily
        const { error: nicknameError } = await callSetUserProfile({ nickname });
        if (nicknameError) {
             setLoading(false);
            // This error comes from the HttpsError in the cloud function
            if (nicknameError.includes('already-exists')) {
                 return "This nickname is already taken. Please choose another one.";
            }
            return nicknameError;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser = userCredential.user;
        
        await sendEmailVerification(newUser);
        
        // Directly create the user document in Firestore from the client-side
        const db = getFirestore(auth.app);
        const userDocRef = doc(db, 'users', newUser.uid);
        await setDoc(userDocRef, {
            uid: newUser.uid,
            email: newUser.email,
            displayName: nickname,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            apiKey: "",
        });

        // Also update the display name in Auth
        const { error: profileUpdateError } = await callSetUserProfile({ nickname });
        if(profileUpdateError) {
            console.warn("Could not set display name in auth, will be synced later.", profileUpdateError);
        }
        
        setLoading(false);
        await firebaseSignOut(auth);

        return null;
    } catch(err: any) {
       setLoading(false);
       if (err.code === 'auth/email-already-in-use') {
           return 'This email address is already in use by another account.';
       }
       return err.message;
    }
  };


  const forceTokenRefresh = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const idTokenResult = await currentUser.getIdTokenResult(true);
      setIsPremium(!!idTokenResult.claims.isPremium);
      setIsLifetime(!!idTokenResult.claims.isLifetime);
    }
  };

  const sendPasswordResetEmail_ = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return null;
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      return error.message || "An unknown error occurred.";
    }
  };

  const confirmPasswordReset = async (code: string, newPassword: string) => {
    try {
      await firebaseConfirmPasswordReset(auth, code, newPassword);
      return null;
    } catch (error: any) {
      console.error("Error resetting password:", error);
      if (error.code === 'auth/invalid-action-code') {
        return "The password reset link is invalid or has expired. Please request a new one.";
      }
      return error.message || "An unknown error occurred while resetting the password.";
    }
  };

   const handleVerifyEmail = async (actionCode: string) => {
    try {
      await applyActionCode(auth, actionCode);
      return null;
    } catch (error: any) {
      console.error("Error verifying email:", error);
       if (error.code === 'auth/invalid-action-code') {
        return "The verification link is invalid or has expired. Please try signing up again.";
      }
      return "An error occurred during email verification.";
    }
  };
  
  const saveUserProfile = async (nickname: string, aiApiKey: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save your profile.",
        variant: "destructive",
      });
      return;
    }
  
    const dataToSave: { nickname?: string, apiKey?: string } = {};

    const emailPrefix = user.email?.split('@')[0];
    const isDefaultNickname = userProfile?.displayName === emailPrefix;

    if (isDefaultNickname && nickname && nickname !== userProfile?.displayName) {
        dataToSave.nickname = nickname;
    }
    
    if (aiApiKey !== userProfile?.apiKey) {
        dataToSave.apiKey = aiApiKey;
    }

    if (Object.keys(dataToSave).length === 0) {
        toast({ title: "No Changes", description: "There were no new details to save." });
        return;
    }

    try {
        const result = await callSetUserProfile(dataToSave);
        if (result.error) {
            throw new Error(result.error);
        }
        toast({ title: "Success", description: "Profile saved successfully!" });
    } catch (error: any) {
        console.error("Error saving profile: ", error);
        toast({
          title: "Error",
          description: error.message || "Failed to save profile. Please try again.",
          variant: "destructive",
        });
    }
  };

  const value: AuthContextType = { 
      user, 
      userProfile, 
      loading, 
      isPremium, 
      isLifetime, 
      signOut, 
      signInWithEmail, 
      signUpWithEmail, 
      forceTokenRefresh, 
      sendPasswordResetEmail: sendPasswordResetEmail_, 
      confirmPasswordReset, 
      handleVerifyEmail, 
      saveUserProfile
  };

  return <AuthContext.Provider value={value}> {children} </AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext<AuthContextType | undefined>(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
