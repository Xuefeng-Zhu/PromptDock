import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFirebaseConfig,
  isFirebaseAnalyticsConfigured,
  resetFirebaseInstances,
  shouldEnableFirebaseAnalytics,
} from '../config';

function stubCoreFirebaseConfig(): void {
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
  vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
}

afterEach(() => {
  vi.unstubAllEnvs();
  resetFirebaseInstances();
});

describe('Firebase config', () => {
  it('returns null when core Firebase config is missing', () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');

    expect(getFirebaseConfig()).toBeNull();
    expect(isFirebaseAnalyticsConfigured()).toBe(false);
  });

  it('includes optional Analytics config when present', () => {
    stubCoreFirebaseConfig();
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123:web:abc');
    vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-ABC123');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.firebasestorage.app');

    expect(getFirebaseConfig()).toEqual({
      apiKey: 'test-api-key',
      authDomain: 'test-project.firebaseapp.com',
      projectId: 'test-project',
      appId: '1:123:web:abc',
      measurementId: 'G-ABC123',
      messagingSenderId: '123',
      storageBucket: 'test-project.firebasestorage.app',
    });
    expect(isFirebaseAnalyticsConfigured()).toBe(true);
  });

  it('disables Analytics in emulator mode or when explicitly disabled', () => {
    stubCoreFirebaseConfig();
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123:web:abc');
    vi.stubEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-ABC123');

    vi.stubEnv('VITE_USE_EMULATOR', 'true');
    expect(shouldEnableFirebaseAnalytics()).toBe(false);

    vi.stubEnv('VITE_USE_EMULATOR', 'false');
    vi.stubEnv('VITE_FIREBASE_ANALYTICS_ENABLED', 'false');
    expect(shouldEnableFirebaseAnalytics()).toBe(false);
  });
});
