// @vitest-environment jsdom
import { describe, expect, it, afterEach } from 'vitest';
import { isTauriRuntime } from '../runtime';

afterEach(() => {
  Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
});

describe('isTauriRuntime', () => {
  it('returns false in a browser runtime', () => {
    Reflect.deleteProperty(window, '__TAURI_INTERNALS__');

    expect(isTauriRuntime()).toBe(false);
  });

  it('returns true when Tauri internals are present', () => {
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    });

    expect(isTauriRuntime()).toBe(true);
  });
});
