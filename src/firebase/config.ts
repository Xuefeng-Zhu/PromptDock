/**
 * Firebase configuration module with lazy initialization.
 *
 * Firebase SDK is NOT imported or initialized until the user opts into sync.
 * This keeps the local-mode bundle lean and avoids any Firebase operations
 * when the app is running in Local Mode.
 *
 * Requirements: 25.1, 25.2, 25.3, 25.4, 1.4
 */

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// ─── Cached instances ──────────────────────────────────────────────────────────

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _firestore: Firestore | null = null;

// ─── Configuration ─────────────────────────────────────────────────────────────

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
}

/**
 * Read Firebase configuration from Vite environment variables.
 * Returns null if required variables are not set.
 */
export function getFirebaseConfig(): FirebaseConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (!apiKey || !authDomain || !projectId) {
    return null;
  }

  return { apiKey, authDomain, projectId };
}

/**
 * Check whether the app should connect to Firebase emulators.
 */
export function shouldUseEmulator(): boolean {
  return import.meta.env.VITE_USE_EMULATOR === 'true';
}

/**
 * Get emulator host configuration from environment variables.
 */
export function getEmulatorConfig() {
  return {
    authHost: import.meta.env.VITE_EMULATOR_AUTH_HOST || 'http://localhost:9099',
    firestoreHost: import.meta.env.VITE_EMULATOR_FIRESTORE_HOST || 'localhost:8080',
  };
}

// ─── Lazy Initialization ───────────────────────────────────────────────────────

/**
 * Get or initialize the Firebase App instance.
 * Firebase SDK is only imported and initialized on first call.
 * Throws if Firebase config environment variables are not set.
 */
export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (_app) return _app;

  const config = getFirebaseConfig();
  if (!config) {
    throw new Error(
      'Firebase configuration is missing. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID environment variables.',
    );
  }

  const { initializeApp } = await import('firebase/app');
  _app = initializeApp(config);
  return _app;
}

/**
 * Get or initialize the Firebase Auth instance.
 * Connects to the Auth emulator when VITE_USE_EMULATOR=true.
 */
export async function getFirebaseAuth(): Promise<Auth> {
  if (_auth) return _auth;

  const app = await getFirebaseApp();
  const { getAuth, connectAuthEmulator } = await import('firebase/auth');
  _auth = getAuth(app);

  if (shouldUseEmulator()) {
    const { authHost } = getEmulatorConfig();
    connectAuthEmulator(_auth, authHost, { disableWarnings: true });
  }

  return _auth;
}

/**
 * Get or initialize the Firestore instance.
 * Enables persistent local cache for offline support.
 * Connects to the Firestore emulator when VITE_USE_EMULATOR=true.
 */
export async function getFirebaseFirestore(): Promise<Firestore> {
  if (_firestore) return _firestore;

  const app = await getFirebaseApp();
  const { initializeFirestore, persistentLocalCache, connectFirestoreEmulator } = await import(
    'firebase/firestore'
  );

  _firestore = initializeFirestore(app, {
    localCache: persistentLocalCache(),
  });

  if (shouldUseEmulator()) {
    const { firestoreHost } = getEmulatorConfig();
    const [host, portStr] = firestoreHost.split(':');
    const port = parseInt(portStr, 10) || 8080;
    connectFirestoreEmulator(_firestore, host, port);
  }

  return _firestore;
}

// ─── Reset (for testing) ───────────────────────────────────────────────────────

/**
 * Reset all cached Firebase instances. Used in tests only.
 */
export function resetFirebaseInstances(): void {
  _app = null;
  _auth = null;
  _firestore = null;
}
