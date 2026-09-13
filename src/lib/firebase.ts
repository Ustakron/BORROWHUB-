/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase initialization (BORROWHUB — project: borrowhub-dd9fe)
 * Firebase Console: https://console.firebase.google.com/project/borrowhub-dd9fe
 */
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Vite env (รองรับการ override ผ่าน .env) — ค่า fallback คือ config ของโปรเจกต์ BORROWHUB
const env: Record<string, string | undefined> =
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {});

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCrdzMu1hCvgDZXYDCFOmYW8R_cRAz3NAw',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'borrowhub-dd9fe.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'borrowhub-dd9fe',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? 'borrowhub-dd9fe.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '70792299022',
  appId: env.VITE_FIREBASE_APP_ID ?? '1:70792299022:web:c00d843a1a0bbbb89af25f',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-1QQMD44C5L',
};

// ลิงก์ไปยัง Firebase Console / Firestore ของโปรเจกต์นี้
export const FIREBASE_CONSOLE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}`;
export const FIRESTORE_CONSOLE_URL = `${FIREBASE_CONSOLE_URL}/firestore`;
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;

try {
  app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);

  // Google Analytics (เปิดเฉพาะเบราว์เซอร์ที่รองรับ — ไม่ทำให้แอปพังถ้าโหลดไม่ได้)
  import('firebase/analytics')
    .then(({ getAnalytics, isSupported }) => {
      isSupported()
        .then((ok) => {
          if (ok && app) getAnalytics(app);
        })
        .catch(() => {});
    })
    .catch(() => {});
} catch (err) {
  console.warn('[Firebase] เชื่อมต่อไม่สำเร็จ — แอปจะยังใช้ localStorage ต่อไป:', err);
}

export const firebaseApp = app;
export const db = firestore;
/** true เมื่อ Firebase พร้อมใช้งาน (init สำเร็จ) */
export const isFirebaseReady = !!firestore;