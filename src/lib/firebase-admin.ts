
import { initializeApp, getApps, App } from 'firebase-admin/app';

let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}


export { adminApp };
