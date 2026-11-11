import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

function initAdmin() {
  if (getApps().length) return getApps()[0];
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error('Firebase Admin credentials belum dikonfigurasi di environment variables.');
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function adminAuth() {
  initAdmin();
  return getAuth();
}

export function adminDb() {
  initAdmin();
  return getFirestore();
}

export function adminStorage() {
  initAdmin();
  return getStorage();
}

export { FieldValue };
