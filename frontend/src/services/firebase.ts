import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  onIdTokenChanged,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'campuscycle.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'campuscycle',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'campuscycle.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const getCurrentToken = async (forceRefresh: boolean = false): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken(forceRefresh);
  } catch (err) {
    console.error('Failed to retrieve or refresh Firebase ID token:', err);
    return null;
  }
};

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return cred;
};

export const logout = () => fbSignOut(auth);
export { onAuthStateChanged, onIdTokenChanged };
export type { FirebaseUser };
