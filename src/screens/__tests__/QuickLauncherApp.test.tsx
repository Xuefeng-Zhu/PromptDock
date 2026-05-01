// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const { mockInitializeApp } = vi.hoisted(() => ({
  mockInitializeApp: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../App', () => ({
  initializeApp: mockInitializeApp,
  ThemeManager: () => <div data-testid="theme-manager" />,
}));

vi.mock('../../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../QuickLauncherWindow', () => ({
  QuickLauncherWindow: () => <div>Launcher Ready</div>,
}));

import { QuickLauncherApp } from '../QuickLauncherApp';

describe('QuickLauncherApp', () => {
  beforeEach(() => {
    mockInitializeApp.mockReset();
    mockInitializeApp.mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes the quick launcher with shared background app services', async () => {
    render(<QuickLauncherApp />);

    await waitFor(() => {
      expect(screen.getByText('Launcher Ready')).toBeDefined();
    });

    expect(mockInitializeApp).toHaveBeenCalledWith({
      seedDefaultData: false,
      registerGlobalHotkey: false,
      enableBackgroundServices: true,
      restoreAuthSession: true,
      syncMigrationChoice: 'fresh',
    });
    expect(screen.getByTestId('theme-manager')).toBeDefined();
  });

  it('shows an initialization error instead of a blank launcher', async () => {
    mockInitializeApp.mockRejectedValueOnce(new Error('store unavailable'));

    render(<QuickLauncherApp />);

    await waitFor(() => {
      expect(screen.getByText('Launcher failed to load')).toBeDefined();
    });
    expect(screen.getByText('Error: store unavailable')).toBeDefined();
  });
});
