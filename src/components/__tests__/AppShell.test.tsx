// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '../AppShell';
import type { AppState } from '../AppShell';
import { MOCK_PROMPTS, MOCK_FOLDERS } from '../../data/mock-data';

/** Minimal initial state override for focused shell tests */
const testState: AppState = {
  screen: { name: 'library' },
  selectedPromptId: null,
  searchQuery: '',
  activeFilter: 'all',
  activeSidebarItem: 'library',
  commandPaletteOpen: false,
  variableFillPromptId: null,
  prompts: MOCK_PROMPTS,
  folders: MOCK_FOLDERS,
};

describe('AppShell', () => {
  it('renders the TopBar', () => {
    render(<AppShell initialStateOverride={testState} />);
    expect(screen.getByText('PromptDock')).toBeDefined();
  });

  it('renders the Sidebar', () => {
    render(<AppShell initialStateOverride={testState} />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeDefined();
  });

  it('renders the main content area', () => {
    render(<AppShell initialStateOverride={testState} />);
    const main = screen.getByRole('main');
    expect(main).toBeDefined();
  });

  it('shows Library screen by default', () => {
    render(<AppShell initialStateOverride={testState} />);
    // Library screen renders an "All Prompts" heading (h1) distinct from the sidebar item
    const headings = screen.getAllByText('All Prompts');
    // At least two: one in sidebar, one as the library screen heading
    expect(headings.length).toBeGreaterThanOrEqual(2);
    const h1 = headings.find((el) => el.tagName === 'H1');
    expect(h1).toBeDefined();
  });

  it('opens command palette when ⌘K is pressed', () => {
    render(<AppShell initialStateOverride={testState} />);
    // Command palette should not be visible initially
    expect(screen.queryByTestId('command-palette-backdrop')).toBeNull();

    // Press ⌘K
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    // Command palette should now be visible
    expect(screen.getByTestId('command-palette-backdrop')).toBeDefined();
  });

  it('opens command palette when Ctrl+K is pressed', () => {
    render(<AppShell initialStateOverride={testState} />);
    expect(screen.queryByTestId('command-palette-backdrop')).toBeNull();

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(screen.getByTestId('command-palette-backdrop')).toBeDefined();
  });

  it('renders sidebar folder items from mock data', () => {
    render(<AppShell initialStateOverride={testState} />);
    expect(screen.getByText('Writing')).toBeDefined();
    expect(screen.getByText('Product')).toBeDefined();
    expect(screen.getByText('Engineering')).toBeDefined();
    expect(screen.getByText('Work')).toBeDefined();
  });
});
