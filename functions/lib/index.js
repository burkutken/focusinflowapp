'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByNickname = exports.setUserProfile = exports.listUsers = exports.paddleWebhook = void 0;
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
const functions = __importStar(require("firebase-functions/v2"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const paddle_node_sdk_1 = require("@paddle/paddle-node-sdk");
firebase_admin_1.default.initializeApp();
const db = firebase_admin_1.default.firestore();
// Initialize the Paddle SDK
const paddle = new paddle_node_sdk_1.Paddle(process.env.PADDLE_API_KEY, {
    environment: paddle_node_sdk_1.Environment.sandbox, // Use Environment.production for live
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
function getPlanFromTransaction(transactionData) {
    var _a;
    if (!transactionData.items || transactionData.items.length === 0) {
        return null;
    }
    const priceId = (_a = transactionData.items[0].price) === null || _a === void 0 ? void 0 : _a.id;
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
exports.paddleWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    const signature = req.headers['paddle-signature'];
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
    let event;
    try {
        event = await paddle.webhooks.unmarshal(requestBody.toString(), secret, signature);
        if (!event) {
            functions.logger.error('Event data is missing after unmarshal.');
            res.status(400).send('Invalid event data.');
            return;
        }
        functions.logger.log(`Received valid Paddle event: ${event.eventType} with ID: ${event.eventId}`);
        if (event.eventType !== paddle_node_sdk_1.EventName.TransactionCompleted) {
            functions.logger.info(`Ignoring Paddle event: ${event.eventType}`);
            res.status(200).send('Event ignored.');
            return;
        }
        const transactionData = event.data;
        const userId = (_a = event.data.customData) === null || _a === void 0 ? void 0 : _a.userId;
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
        const user = await firebase_admin_1.default.auth().getUser(userId);
        let claims = {};
        if (plan === 'premium') {
            claims = { isPremium: true, isLifetime: false };
        }
        else if (plan === 'lifetime') {
            claims = { isPremium: false, isLifetime: true };
        }
        await firebase_admin_1.default.auth().setCustomUserClaims(user.uid, claims);
        // Log the event as processed to prevent reuse
        await eventRef.set({
            eventType: event.eventType,
            processedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            userId: userId,
            plan: plan,
        });
        functions.logger.log(`Successfully updated claims for user ${userId}.`, { claims });
        res.status(200).send('User claims successfully updated.');
    }
    catch (error) {
        functions.logger.error('Error processing Paddle webhook:', error);
        if (error.name === 'PaddleSDKError') {
            res.status(400).send(`Webhook signature verification failed: ${error.message}`);
        }
        else if (error.code === 'auth/user-not-found') {
            res.status(404).send(`User not found.`);
        }
        else {
            res.status(500).send('An unexpected error occurred.');
        }
    }
});
// Admin function to list all users and their claims
exports.listUsers = functions.https.onCall(async (request) => {
    var _a;
    // Check if the user is an admin
    if (((_a = request.auth) === null || _a === void 0 ? void 0 : _a.token.admin) !== true) {
        throw new functions.https.HttpsError('permission-denied', 'You must be an admin to perform this action.');
    }
    try {
        const listUsersResult = await firebase_admin_1.default.auth().listUsers();
        const users = listUsersResult.users.map(userRecord => {
            const claims = userRecord.customClaims || {};
            let status = 'Free';
            if (claims.admin) {
                status = 'Admin';
            }
            else if (claims.isLifetime) {
                status = 'Lifetime';
            }
            else if (claims.isPremium) {
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
    }
    catch (error) {
        functions.logger.error('Error listing users:', error);
        throw new functions.https.HttpsError('internal', 'Unable to list users.');
    }
});
exports.setUserProfile = functions.https.onCall(async (request) => {
    var _a, _b, _c, _d, _e;
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called by an authenticated user.');
    }
    const { uid } = request.auth.token;
    const { nickname, apiKey } = request.data;
    const db = firebase_admin_1.default.firestore();
    const userRef = db.collection('users').doc(uid);
    const dataToUpdate = {
        updatedAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
    };
    // Nickname update logic
    if (nickname) {
        if (typeof nickname !== 'string' || nickname.length < 3) {
            throw new functions.https.HttpsError('invalid-argument', 'A valid nickname must be provided (at least 3 characters).');
        }
        try {
            const userDoc = await userRef.get();
            const emailPrefix = (_b = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.email) === null || _b === void 0 ? void 0 : _b.split('@')[0];
            const isDefaultNickname = !((_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.displayName) || ((_d = userDoc.data()) === null || _d === void 0 ? void 0 : _d.displayName) === emailPrefix;
            // Only allow nickname change if it's the default one or not set yet.
            if (isDefaultNickname) {
                const nicknameQuery = db.collection('users').where('displayName', '==', nickname);
                const nicknameDocs = await nicknameQuery.get();
                if (!nicknameDocs.empty) {
                    throw new functions.https.HttpsError('already-exists', 'This nickname is already taken.');
                }
                await firebase_admin_1.default.auth().updateUser(uid, { displayName: nickname });
                dataToUpdate.displayName = nickname;
            }
            else if (nickname !== ((_e = userDoc.data()) === null || _e === void 0 ? void 0 : _e.displayName)) {
                // Nickname has been set before to a custom one, throw an error if they try to change it
                throw new functions.https.HttpsError('permission-denied', 'Nickname can only be set once.');
            }
        }
        catch (error) {
            functions.logger.error('Error in setUserProfile (nickname):', error);
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
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
    }
    catch (e) {
        functions.logger.error("Error updating user profile in firestore", e);
        throw new functions.https.HttpsError('internal', 'Failed to save profile details.');
    }
});
exports.findUserByNickname = functions.https.onCall(async (request) => {
    // This function can be called by anyone, so no auth check is needed here,
    // but we only return non-sensitive data (the email).
    const { nickname } = request.data;
    if (!nickname) {
        throw new functions.https.HttpsError('invalid-argument', 'A nickname must be provided.');
    }
    try {
        const db = firebase_admin_1.default.firestore();
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
    }
    catch (error) {
        functions.logger.error('Error finding user by nickname:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'An internal error occurred while finding the user.');
    }
});
//# sourceMappingURL=index.js.map