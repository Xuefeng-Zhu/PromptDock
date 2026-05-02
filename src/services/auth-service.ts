/**
 * AuthService — Firebase Auth implementation of IAuthService.
 *
 * Handles sign-up, sign-in, sign-out, session restore, password reset,
 * and auth state observation. On sign-in the app transitions from Local Mode
 * to Synced Mode; on sign-out it transitions back to Local Mode.
 *
 * Requirements: 2.1, 2.2, 2.6, 3.1, 3.2, 3.3, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 5.6
 */

import type { IAuthService } from './interfaces';
import type { AuthResult, AuthUser, AuthError } from '../types/index';

// ─── Firebase Error Code Mapping ───────────────────────────────────────────────

function mapFirebaseAuthError(error: unknown): AuthError {
  const errorCode = (error as { code?: string }).code ?? '';
  const message = error instanceof Error ? error.message : '';

  if (message.includes('Firebase configuration is missing')) {
    return 'missing-configuration';
  }

  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'invalid-credentials';
    case 'auth/email-already-in-use':
      return 'email-in-use';
    case 'auth/weak-password':
      return 'weak-password';
    case 'auth/network-request-failed':
      return 'network';
    case 'auth/popup-blocked':
      return 'popup-blocked';
    case 'auth/cancelled-popup-request':
    case 'auth/popup-closed-by-user':
      return 'popup-cancelled';
    default:
      return 'unknown';
  }
}

function toAuthUser(firebaseUser: { uid: string; email: string | null; displayName: string | null }): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName,
  };
}

// ─── AuthService ───────────────────────────────────────────────────────────────

export class AuthService implements IAuthService {
  /**
   * Ensure the signed-in user has the Firestore documents required by sync.
   *
   * The app uses the user id as the default workspace id. Prompt reads/writes
   * require `/workspaces/{uid}/members/{uid}`, so auth success must be followed
   * by this bootstrap before synced mode starts listening to prompt data.
   */
  private async bootstrapUserWorkspace(user: AuthUser): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, serverTimestamp, writeBatch } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const userRef = doc(firestore, 'users', user.uid);
    const workspaceRef = doc(firestore, 'workspaces', user.uid);
    const memberRef = doc(firestore, 'workspaces', user.uid, 'members', user.uid);
    const timestamp = serverTimestamp();

    const batch = writeBatch(firestore);
    batch.set(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        lastSignedInAt: timestamp,
      },
      { merge: true },
    );
    batch.set(
      workspaceRef,
      {
        name: 'Personal Workspace',
        ownerId: user.uid,
        updatedAt: timestamp,
      },
      { merge: true },
    );
    batch.set(
      memberRef,
      {
        id: user.uid,
        userId: user.uid,
        workspaceId: user.uid,
        role: 'owner',
        joinedAt: timestamp,
      },
      { merge: true },
    );

    await batch.commit();
  }

  private async finishAuth(credentialUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
  }): Promise<AuthResult> {
    const user = toAuthUser(credentialUser);

    try {
      await this.bootstrapUserWorkspace(user);
    } catch (error) {
      console.error('Failed to bootstrap Firebase user workspace:', error);
    }

    return { success: true, user };
  }

  /**
   * Create a new account with email and password.
   * On success, bootstraps the user's Firestore profile and default workspace.
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { getFirebaseAuth } = await import('../firebase/config');
      const { createUserWithEmailAndPassword } = await import('firebase/auth');

      const auth = await getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return await this.finishAuth(credential.user);
    } catch (error: unknown) {
      return { success: false, error: mapFirebaseAuthError(error) };
    }
  }

  /**
   * Sign in with email and password.
   * Transitions the app from Local Mode to Synced Mode on success.
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { getFirebaseAuth } = await import('../firebase/config');
      const { signInWithEmailAndPassword } = await import('firebase/auth');

      const auth = await getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return await this.finishAuth(credential.user);
    } catch (error: unknown) {
      return { success: false, error: mapFirebaseAuthError(error) };
    }
  }

  /**
   * Sign in or create an account with Google.
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const { getFirebaseAuth } = await import('../firebase/config');
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const credential = await signInWithPopup(auth, provider);
      return await this.finishAuth(credential.user);
    } catch (error: unknown) {
      return { success: false, error: mapFirebaseAuthError(error) };
    }
  }

  /**
   * Sign out the current user.
   * Transitions the app back to Local Mode.
   */
  async signOut(): Promise<void> {
    const { getFirebaseAuth } = await import('../firebase/config');
    const { signOut: firebaseSignOut } = await import('firebase/auth');

    const auth = await getFirebaseAuth();
    await firebaseSignOut(auth);
  }

  /**
   * Attempt to restore a previously authenticated session on launch.
   * Returns the current user if a session exists, or null if not.
   * Silently falls back to Local Mode on failure (no error thrown).
   */
  async restoreSession(): Promise<AuthResult | null> {
    try {
      const { getFirebaseAuth } = await import('../firebase/config');
      const { onAuthStateChanged: firebaseOnAuthStateChanged } = await import('firebase/auth');

      const auth = await getFirebaseAuth();

      // Wait for the auth state to be resolved
      return new Promise<AuthResult | null>((resolve) => {
        const unsubscribe = firebaseOnAuthStateChanged(auth, (firebaseUser) => {
          unsubscribe();
          if (firebaseUser) {
            const user = toAuthUser(firebaseUser);
            void this.bootstrapUserWorkspace(user)
              .catch((error) => {
                console.error('Failed to bootstrap restored Firebase user workspace:', error);
              })
              .finally(() => {
                resolve({ success: true, user });
              });
          } else {
            resolve(null);
          }
        });
      });
    } catch {
      // Silently fall back to Local Mode on any failure
      return null;
    }
  }

  /**
   * Send a password reset email to the provided address.
   * Does not reveal whether the email is registered (Firebase handles this).
   */
  async sendPasswordReset(email: string): Promise<void> {
    const { getFirebaseAuth } = await import('../firebase/config');
    const { sendPasswordResetEmail } = await import('firebase/auth');

    const auth = await getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
  }

  /**
   * Subscribe to auth state changes.
   * Returns an unsubscribe function.
   *
   * Uses a `disposed` flag so that if the caller tears down before the async
   * Firebase setup completes, the listener is detached immediately once setup
   * finishes — preventing leaked subscriptions.
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    let unsubscribe: (() => void) | null = null;
    let disposed = false;

    // Initialize asynchronously — the listener is set up once Firebase is ready
    (async () => {
      try {
        const { getFirebaseAuth } = await import('../firebase/config');
        const { onAuthStateChanged: firebaseOnAuthStateChanged } = await import('firebase/auth');

        const auth = await getFirebaseAuth();

        // If the caller already cleaned up while we were awaiting, don't attach
        if (disposed) return;

        unsubscribe = firebaseOnAuthStateChanged(auth, (firebaseUser) => {
          if (firebaseUser) {
            callback(toAuthUser(firebaseUser));
          } else {
            callback(null);
          }
        });
      } catch {
        // If Firebase init fails, report null (Local Mode)
        if (!disposed) {
          callback(null);
        }
      }
    })();

    // Return a function that will unsubscribe when called
    return () => {
      disposed = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }
}
