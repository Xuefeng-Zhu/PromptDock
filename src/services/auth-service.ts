import type { AuthResult, AuthUser } from '../types';
import type { IAuthService } from './interfaces';
import { initializeFirebase } from '../firebase/config';

export class AuthService implements IAuthService {
  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { auth } = await initializeFirebase();
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');
      const { getFirebaseDb } = await import('../firebase/config');

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user: AuthUser = { uid: cred.user.uid, email: cred.user.email!, displayName: cred.user.displayName };

      const db = getFirebaseDb();
      if (db) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid, email: user.email, displayName: user.displayName, createdAt: new Date(),
        });
      }

      return { success: true, user };
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/email-already-in-use') return { success: false, error: 'email-in-use' };
      if (code === 'auth/weak-password') return { success: false, error: 'weak-password' };
      return { success: false, error: 'unknown' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { auth } = await initializeFirebase();
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: { uid: cred.user.uid, email: cred.user.email!, displayName: cred.user.displayName } };
    } catch {
      return { success: false, error: 'invalid-credentials' };
    }
  }

  async signOut(): Promise<void> {
    const { auth } = await initializeFirebase();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  }

  async restoreSession(): Promise<AuthResult | null> {
    try {
      const { auth } = await initializeFirebase();
      const user = auth.currentUser;
      if (user) return { success: true, user: { uid: user.uid, email: user.email!, displayName: user.displayName } };
      return null;
    } catch {
      return null;
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { auth } = await initializeFirebase();
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    let unsubscribe = () => {};
    initializeFirebase().then(({ auth }) => {
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          callback(fbUser ? { uid: fbUser.uid, email: fbUser.email!, displayName: fbUser.displayName } : null);
        });
      });
    });
    return () => unsubscribe();
  }
}
