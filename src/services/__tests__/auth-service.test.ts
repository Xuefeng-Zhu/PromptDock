import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../auth-service';

const firebaseConfigMocks = vi.hoisted(() => ({
  getFirebaseAuth: vi.fn(async () => ({ name: 'auth' })),
  getFirebaseFirestore: vi.fn(async () => ({ name: 'firestore' })),
}));

const firebaseAuthMocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

const firebaseFirestoreMocks = vi.hoisted(() => ({
  doc: vi.fn((...path: string[]) => path.join('/')),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(async () => undefined),
  })),
}));

vi.mock('../../firebase/config', () => firebaseConfigMocks);
vi.mock('firebase/auth', () => firebaseAuthMocks);
vi.mock('firebase/firestore', () => firebaseFirestoreMocks);

beforeEach(() => {
  firebaseConfigMocks.getFirebaseAuth.mockResolvedValue({ name: 'auth' });
  firebaseConfigMocks.getFirebaseFirestore.mockResolvedValue({ name: 'firestore' });
  firebaseAuthMocks.createUserWithEmailAndPassword.mockReset();
  firebaseAuthMocks.signInWithEmailAndPassword.mockReset();
  firebaseAuthMocks.signInWithPopup.mockReset();
  firebaseAuthMocks.onAuthStateChanged.mockReset();
  firebaseFirestoreMocks.doc.mockImplementation((...path: string[]) => path.join('/'));
  firebaseFirestoreMocks.serverTimestamp.mockReturnValue('server-timestamp');
  firebaseFirestoreMocks.writeBatch.mockReturnValue({
    set: vi.fn(),
    commit: vi.fn(async () => undefined),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('AuthService', () => {
  it('does not block sign-in on workspace bootstrap', async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    firebaseAuthMocks.signInWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: 'user-123',
        email: 'user@example.com',
        displayName: 'Test User',
      },
    });
    firebaseFirestoreMocks.writeBatch.mockReturnValue({
      set: vi.fn(),
      commit: vi.fn(() => new Promise(() => {})),
    });

    const result = new AuthService().signIn('user@example.com', 'password123');

    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(3000);

    await expect(result).resolves.toEqual({
      success: true,
      user: {
        uid: 'user-123',
        email: 'user@example.com',
        displayName: 'Test User',
      },
    });
    consoleError.mockRestore();
  });

  it('does not block sign-up on workspace bootstrap', async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    firebaseAuthMocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: 'new-user',
        email: 'new@example.com',
        displayName: null,
      },
    });
    firebaseFirestoreMocks.writeBatch.mockReturnValue({
      set: vi.fn(),
      commit: vi.fn(() => new Promise(() => {})),
    });

    const result = new AuthService().signUp('new@example.com', 'password123');

    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(3000);

    await expect(result).resolves.toEqual({
      success: true,
      user: {
        uid: 'new-user',
        email: 'new@example.com',
        displayName: null,
      },
    });
    consoleError.mockRestore();
  });

  it('returns a network error if email sign-in never resolves', async () => {
    vi.useFakeTimers();
    firebaseAuthMocks.signInWithEmailAndPassword.mockReturnValue(new Promise(() => {}));

    const result = new AuthService().signIn('user@example.com', 'password123');

    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(15000);

    await expect(result).resolves.toEqual({
      success: false,
      error: 'network',
    });
  });

  it('falls back to local mode if Firebase auth state restore never resolves', async () => {
    vi.useFakeTimers();
    const unsubscribe = vi.fn();
    firebaseAuthMocks.onAuthStateChanged.mockReturnValue(unsubscribe);

    const result = new AuthService().restoreSession();

    await vi.dynamicImportSettled();
    await vi.advanceTimersByTimeAsync(3000);

    await expect(result).resolves.toBeNull();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not block session restore on workspace bootstrap', async () => {
    const unsubscribe = vi.fn();
    firebaseAuthMocks.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback({
        uid: 'user-123',
        email: 'user@example.com',
        displayName: 'Test User',
      });
      return unsubscribe;
    });
    firebaseFirestoreMocks.writeBatch.mockReturnValue({
      set: vi.fn(),
      commit: vi.fn(() => new Promise(() => {})),
    });

    await expect(new AuthService().restoreSession()).resolves.toEqual({
      success: true,
      user: {
        uid: 'user-123',
        email: 'user@example.com',
        displayName: 'Test User',
      },
    });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
