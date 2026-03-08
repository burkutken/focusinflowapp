
'use strict';
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions/v2';
import admin from 'firebase-admin';
import { Paddle, EventName, Environment, type TransactionCompletedEvent, type EventEntity } from '@paddle/paddle-node-sdk';

admin.initializeApp();
const db = admin.firestore();

// Initialize the Paddle SDK
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: Environment.sandbox, // Use Environment.production for live
});

const PADDLE_PRICE_IDS = {
  monthly: 'pri_01k4z4s5xxdgfaq5ff3530j0j5', // $1.99
  annual: 'pri_01k4z4x7c8g7j1a5x0y1q2w3e4', // $19.00
  lifetime: 'pri_01k4z50jzhyswpcb9ghk2zvn5z', // $9.99
};

/**
 * This is a helper function to determine the plan type from a transaction.
 * @param {TransactionCompletedEvent['data']} transactionData The transaction data from Paddle.
 * @return {'premium' | 'lifetime' | null} The plan type or null if not identified.
 */
function getPlanFromTransaction(transactionData: TransactionCompletedEvent['data']): 'premium' | 'lifetime' | null {
    if (!transactionData.items || transactionData.items.length === 0) {
        return null;
    }
    const priceId = transactionData.items[0].price?.id;
    if (!priceId) {
        return null;
    }

    if (priceId === PADDLE_PRICE_IDS.monthly || priceId === PADDLE_PRICE_IDS.annual) {
        return 'premium';
    }
    if (priceId === PADDLE_PRICE_IDS.lifetime) {
        return 'lifetime';
    }
    return null;
}


// Export the Express app as an onRequest Cloud Function
export const paddleWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['paddle-signature'] as string;
  const requestBody = req.rawBody; // Use the raw, unparsed body
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!secret) {
      functions.logger.error('Paddle webhook secret is not configured. Make sure PADDLE_WEBHOOK_SECRET is set in your environment variables.');
      res.status(500).send('Webhook secret not configured.');
      return;
  }
  
  if (!requestBody) {
      functions.logger.error('Request body is missing.');
      res.status(400).send('Request body is missing.');
      return;
  }

  let event: EventEntity | undefined;
  try {
    event = await paddle.webhooks.unmarshal(requestBody.toString(), secret, signature);

    if (!event) {
        functions.logger.error('Event data is missing after unmarshal.');
        res.status(400).send('Invalid event data.');
        return;
    }
    
    functions.logger.log(`Received valid Paddle event: ${event.eventType} with ID: ${event.eventId}`);
    
    if (event.eventType !== EventName.TransactionCompleted) {
        functions.logger.info(`Ignoring Paddle event: ${event.eventType}`);
        res.status(200).send('Event ignored.');
        return;
    }

    const transactionData = event.data as TransactionCompletedEvent['data'];
    const userId = (event.data.customData as Record<string, any>)?.userId as string | undefined;
    const plan = getPlanFromTransaction(transactionData);

    // --- Idempotency Check ---
    const eventRef = db.collection('processedEvents').doc(event.eventId);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
        functions.logger.warn(`Event ${event.eventId} has already been processed. Skipping.`);
        res.status(200).send('Event already processed.');
        return;
    }
    // --- End Idempotency Check ---


    if (!userId) {
        functions.logger.info(`Event '${event.eventType}' did not contain a userId in customData. Skipping user claim update.`, { payload: event.data });
        res.status(200).send('Event processed, no user to upgrade.');
        return;
    }
     if (!plan) {
        functions.logger.info(`Could not determine plan from transaction ${transactionData.id}. Skipping user claim update.`);
        res.status(200).send('Event processed, plan not identified.');
        return;
    }

    functions.logger.log(`Processing event '${event.eventType}' for user: ${userId} with plan: ${plan}`);

    const user = await admin.auth().getUser(userId);
    let claims: { [key: string]: boolean } = {};

    if (plan === 'premium') {
        claims = { isPremium: true, isLifetime: false };
    } else if (plan === 'lifetime') {
        claims = { isPremium: false, isLifetime: true };
    }

    await admin.auth().setCustomUserClaims(user.uid, claims);

    // Log the event as processed to prevent reuse
    await eventRef.set({
        eventType: event.eventType,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: userId,
        plan: plan,
    });


    functions.logger.log(`Successfully updated claims for user ${userId}.`, { claims });
    res.status(200).send('User claims successfully updated.');

} catch (error: any) {
    functions.logger.error('Error processing Paddle webhook:', error);
    if (error.name === 'PaddleSDKError') {
        res.status(400).send(`Webhook signature verification failed: ${error.message}`);
    } else if ((error as any).code === 'auth/user-not-found') {
        res.status(404).send(`User not found.`);
    } else {
        res.status(500).send('An unexpected error occurred.');
    }
}
});

// Admin function to list all users and their claims
export const listUsers = functions.https.onCall(async (request) => {
    // Check if the user is an admin
    if (request.auth?.token.admin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }

    try {
        const listUsersResult = await admin.auth().listUsers();
        const users = listUsersResult.users.map(userRecord => {
            const claims = userRecord.customClaims || {};
            let status: 'Free' | 'Premium' | 'Lifetime' | 'Admin' = 'Free';
            if (claims.admin) {
                status = 'Admin';
            } else if (claims.isLifetime) {
                status = 'Lifetime';
            } else if (claims.isPremium) {
                status = 'Premium';
            }
            
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                status: status,
                nickname: userRecord.displayName,
            };
        });
        return users;
    } catch (error) {
        functions.logger.error('Error listing users:', error);
        throw new functions.https.HttpsError('internal', 'Unable to list users.');
    }
});


export const setUserProfile = functions.https.onCall(async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called by an authenticated user.');
    }

    const { uid } = request.auth.token;
    const { nickname, apiKey } = request.data;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);

    const dataToUpdate: { [key: string]: any } = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Nickname update logic
    if (nickname) {
        if (typeof nickname !== 'string' || nickname.length < 3) {
            throw new functions.https.HttpsError('invalid-argument', 'A valid nickname must be provided (at least 3 characters).');
        }
        
        try {
             const userDoc = await userRef.get();
             const emailPrefix = userDoc.data()?.email?.split('@')[0];
             const isDefaultNickname = !userDoc.data()?.displayName || userDoc.data()?.displayName === emailPrefix;

             // Only allow nickname change if it's the default one or not set yet.
             if (isDefaultNickname) {
                const nicknameQuery = db.collection('users').where('displayName', '==', nickname);
                const nicknameDocs = await nicknameQuery.get();
                if (!nicknameDocs.empty) {
                    throw new functions.https.HttpsError('already-exists', 'This nickname is already taken.');
                }
                
                await admin.auth().updateUser(uid, { displayName: nickname });
                dataToUpdate.displayName = nickname;
             } else if (nickname !== userDoc.data()?.displayName) {
                 // Nickname has been set before to a custom one, throw an error if they try to change it
                 throw new functions.https.HttpsError('permission-denied', 'Nickname can only be set once.');
             }
        } catch (error) {
            functions.logger.error('Error in setUserProfile (nickname):', error);
            if (error instanceof functions.https.HttpsError) { throw error; }
            throw new functions.https.HttpsError('internal', 'An unexpected error occurred while setting nickname.');
        }
    }

    // API Key update logic
    if (apiKey !== undefined) {
         if (typeof apiKey !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'API key must be a string.');
        }
        dataToUpdate.apiKey = apiKey;
    }
    
    if (Object.keys(dataToUpdate).length <= 1) { // only contains serverTimestamp
        return { success: true, message: 'No new data provided to update.' };
    }

    try {
        await userRef.set(dataToUpdate, { merge: true });
        return { success: true, message: 'Profile updated successfully.' };
    } catch(e) {
        functions.logger.error("Error updating user profile in firestore", e);
        throw new functions.https.HttpsError('internal', 'Failed to save profile details.');
    }
});


export const findUserByNickname = functions.https.onCall(async (request) => {
    // This function can be called by anyone, so no auth check is needed here,
    // but we only return non-sensitive data (the email).
    const { nickname } = request.data;
    if (!nickname) {
        throw new functions.https.HttpsError('invalid-argument', 'A nickname must be provided.');
    }

    try {
        const db = admin.firestore();
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('displayName', '==', nickname).limit(1).get();

        if (snapshot.empty) {
            throw new functions.https.HttpsError('not-found', 'No user found with that nickname.');
        }
        
        const userDoc = snapshot.docs[0];
        const email = userDoc.data().email;

        if (!email) {
            throw new functions.https.HttpsError('not-found', 'User email not associated with the nickname.');
        }

        return { email: email };
    } catch (error) {
        functions.logger.error('Error finding user by nickname:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'An internal error occurred while finding the user.');
    }
});
    
    