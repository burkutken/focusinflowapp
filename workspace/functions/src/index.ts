
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
import { Paddle, EventName, Environment, type TransactionCompletedEvent } from '@paddle/paddle-node-sdk';

admin.initializeApp();

// Initialize the Paddle SDK
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: Environment.sandbox, // Use Environment.production for live
});

const PADDLE_PRICE_IDS = {
  monthly: 'pri_01k3er9tfcbwpm9gt2wxk58w08',
  annual: 'pri_01k3gehzk4c9w0xxs9sc9b7756',
  lifetime: 'pri_01k4f9166kz0yj49bnrqjtevda',
};

/**
 * This is a helper function to determine the plan type from a transaction.
 * @param {TransactionCompletedEvent['data']} transactionData The transaction data from Paddle.
 * @return {'premium' | 'lifetime' | null} The plan type or null if not identified.
 */
function getPlanFromTransaction(transactionData: TransactionCompletedEvent['data']): 'premium' | 'lifetime' | null {
    if (!transactionData.lineItems || transactionData.lineItems.length === 0) {
        return null;
    }
    const priceId = transactionData.lineItems[0].priceId;
    if (priceId === PADDLE_PRICE_IDS.monthly || priceId === PADDLE_PRICE_IDS.annual) {
        return 'premium';
    }
    if (priceId === PADDLE_PRICE_IDS.lifetime) {
        return 'lifetime';
    }
    return null;
}


// Export the Express app as an onRequest Cloud Function
export const paddleWebhook = functions.https.onRequest(async (req: { headers: { [x: string]: string; }; rawBody: any; }, res: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): void; new(): any; }; }; }) => {
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

  try {
    const event = paddle.webhooks.unmarshal(requestBody, secret, signature);

    if (!event) {
        functions.logger.error('Event data is missing after unmarshal.');
        res.status(400).send('Invalid event data.');
        return;
    }
    
    functions.logger.log(`Received valid Paddle event: ${event.eventType}`);
    
    if (event.eventType !== EventName.TransactionCompleted) {
        functions.logger.info(`Ignoring Paddle event: ${event.eventType}`);
        res.status(200).send('Event ignored.');
        return;
    }

    const transactionData = event.data as TransactionCompletedEvent['data'];
    const userId = transactionData.customData?.userId as string | undefined;
    const plan = getPlanFromTransaction(transactionData);

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
export const listUsers = functions.https.onCall(async (data: any, context: { auth: { token: { admin: boolean; }; }; }) => {
    // Check if the user is an admin
    if (context.auth?.token.admin !== true) {
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
                status: status
            };
        });
        return users;
    } catch (error) {
        functions.logger.error('Error listing users:', error);
        throw new functions.https.HttpsError('internal', 'Unable to list users.');
    }
});
