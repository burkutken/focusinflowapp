// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCI7Kh7Z-30NxXYZQIPBZ_p7PM9TSERTGQ",
  authDomain: "taskzen-2qitg.firebaseapp.com",
  projectId: "taskzen-2qitg",
  storageBucket: "taskzen-2qitg.appspot.com",
  messagingSenderId: "602115499326",
  appId: "1:602115499326:web:94af7ff323bc3c913c786f",
  measurementId: "G-K7WBPSQJGC"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
