import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBuVc_s6M49lTMVI-JCBxK8vufnLAIU6B8",
  authDomain: "kryz-een.firebaseapp.com",
  projectId: "kryz-een",
  storageBucket: "kryz-een.firebasestorage.app",
  messagingSenderId: "1064974163612",
  appId: "1:1064974163612:web:d159ef8b547523dda65759",
  measurementId: "G-SDXW2T7C9N"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
