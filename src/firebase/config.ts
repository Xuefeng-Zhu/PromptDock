import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export async function initializeFirebase(): Promise<{ app: FirebaseApp; auth: Auth; db: Firestore }> {
  if (app && auth && db) return { app, auth, db };

  const { initializeApp } = await import('firebase/app');
  const { getAuth, connectAuthEmulator } = await import('firebase/auth');
  const { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } = await import('firebase/firestore');

  app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  });

  auth = getAuth(app);
  db = getFirestore(app);

  if (import.meta.env.VITE_USE_EMULATOR === 'true') {
    const authHost = import.meta.env.VITE_EMULATOR_AUTH_HOST || 'http://localhost:9099';
    const firestoreHost = import.meta.env.VITE_EMULATOR_FIRESTORE_HOST || 'http://localhost:8080';
    connectAuthEmulator(auth, authHost);
    const [host, port] = firestoreHost.replace('http://', '').split(':');
    connectFirestoreEmulator(db, host, parseInt(port));
  }

  try {
    await enableIndexedDbPersistence(db);
  } catch {
    // Persistence may already be enabled or not supported
  }

  return { app, auth, db };
}

export function getFirebaseAuth(): Auth | null { return auth; }
export function getFirebaseDb(): Firestore | null { return db; }
