import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;
const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const envMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const envFirestoreDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

const firebaseConfig = {
  apiKey: envApiKey || firebaseConfigJson.apiKey,
  projectId: envProjectId || firebaseConfigJson.projectId,
  appId: envAppId || firebaseConfigJson.appId,
  authDomain: envAuthDomain || firebaseConfigJson.authDomain,
  storageBucket: envStorageBucket || firebaseConfigJson.storageBucket,
  messagingSenderId: envMessagingSenderId || firebaseConfigJson.messagingSenderId,
  firestoreDatabaseId: envFirestoreDatabaseId || firebaseConfigJson.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth).catch((error) => {
  console.error('Sign out error:', error);
});
