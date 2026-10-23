import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { env } from './env';

let appInstance: App | null = null;
let isConfigured = false;

if (!getApps().length) {
  try {
    if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      appInstance = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      });
      isConfigured = true;
      console.log('[FirebaseAdmin] Initialized successfully with environment credentials.');
    } else {
      const candidatePaths = [
        env.FIREBASE_SERVICE_ACCOUNT_PATH ? path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH) : null,
        path.resolve(process.cwd(), 'serviceAccountKey.json'),
        path.resolve(process.cwd(), 'backend', 'serviceAccountKey.json'),
        path.resolve(__dirname, '..', '..', 'serviceAccountKey.json'),
      ].filter((p): p is string => Boolean(p && fs.existsSync(p)));

      if (candidatePaths.length > 0) {
        const resolvedPath = candidatePaths[0];
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        appInstance = initializeApp({
          credential: cert(serviceAccount),
        });
        isConfigured = true;
        console.log('[FirebaseAdmin] Initialized successfully with local service account key file.');
      } else {
        console.warn(
          '[FirebaseAdmin] Notice: Firebase credentials not supplied. Running in local fallback mode. ' +
          'Public endpoints and catalog will use verified seeded inventory. Mutations require credentials.'
        );
      }
    }
  } catch (error) {
    console.warn(
      '[FirebaseAdmin] Warning: Firebase Admin credentials failed to initialize. ' +
      'Protected endpoints will require valid credentials. Public routes remain active.'
    );
  }
} else {
  appInstance = getApps()[0];
  isConfigured = true;
}

export const isFirebaseConfigured = (): boolean => isConfigured;

export const getFirestore = (): Firestore => {
  if (!isConfigured || !appInstance) {
    throw new Error('Firebase Admin is not configured. Please supply Firebase credentials.');
  }
  return getAdminFirestore(appInstance);
};

export const getAuth = (): Auth => {
  if (!isConfigured || !appInstance) {
    throw new Error('Firebase Admin is not configured. Please supply Firebase credentials.');
  }
  return getAdminAuth(appInstance);
};

export { isConfigured as isFirebaseInitialized };
