// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readLayoutMetrics, useLayoutMetrics } from '../use-layout-metrics';

let clientWidth = 390;
let scrollWidth = 390;
let resizeCallback: ResizeObserverCallback;
let mutationCallback: MutationCallback;
let nextFrame: number;
let frames: Map<number, FrameRequestCallback>;
const observeResize = vi.fn();
const disconnectResize = vi.fn();
const observeMutations = vi.fn();
const disconnectMutations = vi.fn();

function flushFrames() {
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach((callback) => callback(0)));
}

beforeEach(() => {
  clientWidth = 390;
  scrollWidth = 390;
  frames = new Map();
  nextFrame = 1;
  vi.clearAllMocks();
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('innerHeight', 844);
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockImplementation(() => clientWidth);
  vi.spyOn(document.documentElement, 'scrollWidth', 'get').mockImplementation(() => scrollWidth);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { resizeCallback = callback; }
    observe = observeResize;
    disconnect = disconnectResize;
  });
  vi.stubGlobal('MutationObserver', class {
    constructor(callback: MutationCallback) { mutationCallback = callback; }
    observe = observeMutations;
    disconnect = disconnectMutations;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('layout measurements', () => {
  it('reads browser dimensions independently and reports real document overflow', () => {
    vi.stubGlobal('innerWidth', 407);
    scrollWidth = 490;
    expect(readLayoutMetrics()).toEqual({
      innerWidth: 407,
      innerHeight: 844,
      clientWidth: 390,
      scrollWidth: 490,
      horizontalOverflow: 100,
    });
    scrollWidth = 380;
    expect(readLayoutMetrics().horizontalOverflow).toBe(0);
  });

  it('starts on demand, batches resize and DOM changes, and supports manual refresh', () => {
    const { result, rerender } = renderHook(({ active }) => useLayoutMetrics(active), {
      initialProps: { active: false },
    });
    expect(result.current.metrics).toBeNull();
    expect(observeResize).not.toHaveBeenCalled();
    expect(observeMutations).not.toHaveBeenCalled();

    rerender({ active: true });
    expect(result.current.metrics?.innerWidth).toBe(390);
    expect(observeResize).toHaveBeenCalledWith(document.documentElement);
    expect(observeResize).toHaveBeenCalledWith(document.body);

    vi.stubGlobal('innerWidth', 768);
    clientWidth = 768;
    scrollWidth = 900;
    act(() => {
      window.dispatchEvent(new Event('resize'));
      resizeCallback([], {} as ResizeObserver);
      mutationCallback([], {} as MutationObserver);
    });
    expect(frames.size).toBe(1);
    flushFrames();
    expect(result.current.metrics).toEqual({
      innerWidth: 768,
      innerHeight: 844,
      clientWidth: 768,
      scrollWidth: 900,
      horizontalOverflow: 132,
    });
    const previous = result.current.metrics;
    act(() => result.current.refresh());
    expect(result.current.metrics).toBe(previous);

    scrollWidth = 768;
    act(() => result.current.refresh());
    expect(result.current.metrics?.horizontalOverflow).toBe(0);
  });

  it('disconnects and cancels pending measurement when closed, then remeasures on reopen', () => {
    const { result, rerender, unmount } = renderHook(({ active }) => useLayoutMetrics(active), {
      initialProps: { active: true },
    });
    act(() => window.dispatchEvent(new Event('resize')));
    expect(frames.size).toBe(1);
    rerender({ active: false });
    expect(disconnectResize).toHaveBeenCalledOnce();
    expect(disconnectMutations).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
    act(() => window.dispatchEvent(new Event('resize')));
    expect(frames.size).toBe(0);

    vi.stubGlobal('innerWidth', 1280);
    rerender({ active: true });
    expect(result.current.metrics?.innerWidth).toBe(1280);
    unmount();
    expect(disconnectResize).toHaveBeenCalledTimes(2);
    expect(disconnectMutations).toHaveBeenCalledTimes(2);
  });

  it('keeps manual and window resize measurement available without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { result } = renderHook(() => useLayoutMetrics(true));
    scrollWidth = 410;
    act(() => window.dispatchEvent(new Event('resize')));
    flushFrames();
    expect(result.current.metrics?.horizontalOverflow).toBe(20);
  });
});
