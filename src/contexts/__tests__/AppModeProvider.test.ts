import { describe, it, expect } from 'vitest';
import { AppModeProvider, useAppMode } from '../AppModeProvider';

describe('AppModeProvider module', () => {
  it('exports AppModeProvider as a function', () => {
    expect(typeof AppModeProvider).toBe('function');
  });

  it('exports useAppMode as a function', () => {
    expect(typeof useAppMode).toBe('function');
  });
});
