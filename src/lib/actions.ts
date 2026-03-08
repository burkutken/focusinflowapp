
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { adminApp } from '@/lib/firebase-admin';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import type { UserRole } from './types';


// In-memory store for free tier usage tracking
const aiUsage: { [userId: string]: { count: number, date: string } } = {};
const FREE_TIER_LIMIT = 5;

async function getUserIdFromToken(idToken: string | undefined | null): Promise<string | null> {
    if (!idToken) return null;
    try {
        const auth = getAuth(adminApp);
        const decodedToken = await auth.verifyIdToken(idToken);
        return decodedToken.uid;
    } catch (error) {
        console.error("Error verifying ID token:", error);
        return null;
    }
}

async function checkAndIncrementUsage(userId: string): Promise<{ canUse: boolean; error?: string }> {
    const db = getFirestore(adminApp);
    const auth = getAuth(adminApp);

    try {
        const [userRecord, userDoc] = await Promise.all([
            auth.getUser(userId),
            db.collection('users').doc(userId).get()
        ]);

        const isPremium = userRecord.customClaims?.isPremium === true;
        const isLifetime = userRecord.customClaims?.isLifetime === true;
        const userApiKey = userDoc.data()?.apiKey;

        if (isPremium) {
            return { canUse: true };
        }

        if (userApiKey) {
            return { canUse: true };
        }
        
        const today = new Date().toISOString().split('T')[0];
        const userUsage = aiUsage[userId];

        if (!userUsage || userUsage.date !== today) {
            aiUsage[userId] = { count: 1, date: today };
            return { canUse: true };
        }

        if (userUsage.count >= FREE_TIER_LIMIT) {
            const message = isLifetime 
                ? 'You have reached the daily AI suggestion limit. Please add your own Google AI API key in your profile to continue.'
                : 'You have reached the daily AI suggestion limit for the free tier. Please upgrade or add your own API key to continue.';
            return { canUse: false, error: message };
        }

        aiUsage[userId].count++;
        return { canUse: true };

    } catch (error) {
        console.error("Error checking user claims/doc:", error);
        return { canUse: false, error: "Could not verify your account status. Please try again." };
    }
}

export async function getSuggestedTimeframe(
  input: any,
  idToken: string
) {
    return { error: "AI features are temporarily unavailable." };
}

export async function getGeneratedChecklist(input: any, idToken: string) {
    return { error: "AI features are temporarily unavailable." };
}


export async function getUserList(): Promise<{ data?: UserRole[], error?: string }> {
    try {
        const functions = getFunctions(app);
        const listUsersFn = httpsCallable(functions, 'listUsers');
        const result = await listUsersFn();
        return { data: result.data as UserRole[] };
    } catch (error: any) {
        console.error('Error fetching user list:', error);
        return { error: error.message || 'Failed to fetch user list.' };
    }
}


export async function findUserByNickname(nickname: string): Promise<{ data?: { email: string }, error?: string }> {
    try {
        const functions = getFunctions(app);
        const findUserByNicknameFn = httpsCallable(functions, 'findUserByNickname');
        const result = await findUserByNicknameFn({ nickname });
        return { data: result.data as { email: string } };
    } catch (error: any) {
        console.error('Error finding user by nickname:', error);
        return { error: error.message || 'An internal error occurred.' };
    }
}


export async function setUserProfile(data: { nickname?: string, apiKey?: string }): Promise<{ success?: boolean, error?: string }> {
    try {
        const functions = getFunctions(app);
        const setUserProfileFn = httpsCallable(functions, 'setUserProfile');
        await setUserProfileFn(data);
        return { success: true };
    } catch (error: any) {
        console.error('Error setting user profile:', error);
        return { error: error.message || 'An unknown error occurred.' };
    }
}

export async function checkNicknameAvailability(nickname: string): Promise<{ isAvailable?: boolean, error?: string }> {
    try {
        const db = getFirestore(adminApp);
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('displayName', '==', nickname).limit(1).get();
        return { isAvailable: snapshot.empty };
    } catch (error) {
        console.error('Error checking nickname availability:', error);
        return { error: 'Failed to check nickname.' };
    }
}
