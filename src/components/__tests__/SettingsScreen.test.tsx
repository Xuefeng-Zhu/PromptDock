// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsScreen } from '../SettingsScreen';

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('SettingsScreen', () => {
  it('renders the Settings heading and Back button', () => {
    render(<SettingsScreen onBack={() => {}} />);
    expect(screen.getByText('Settings')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeDefined();
  });

  it('renders all navigation sections in the nav', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const nav = screen.getByRole('navigation', { name: 'Settings navigation' });
    // Check nav buttons exist within the navigation
    expect(nav.textContent).toContain('Account & Sync');
    expect(nav.textContent).toContain('Appearance');
    expect(nav.textContent).toContain('Hotkey');
    expect(nav.textContent).toContain('Default Behavior');
    expect(nav.textContent).toContain('Import/Export');
    expect(nav.textContent).toContain('About');
  });

  it('renders setting cards for Account, Sync, Appearance, Hotkey, Import/Export, About', () => {
    render(<SettingsScreen onBack={() => {}} />);
    // Account card
    expect(screen.getByText('user@example.com')).toBeDefined();
    // Sync card options
    expect(screen.getByText('Sync off')).toBeDefined();
    expect(screen.getByText('Guest cloud')).toBeDefined();
    expect(screen.getByText('Signed in')).toBeDefined();
    // Appearance card - theme options
    expect(screen.getByText('Light')).toBeDefined();
    expect(screen.getByText('Dark')).toBeDefined();
    expect(screen.getByText('System')).toBeDefined();
    // About card
    expect(screen.getByText('PromptDock')).toBeDefined();
    expect(screen.getByText('v1.0.0')).toBeDefined();
  });

  it('calls onBack when the Back button is clicked', () => {
    const handleBack = vi.fn();
    render(<SettingsScreen onBack={handleBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('highlights the active nav section on click', () => {
    render(<SettingsScreen onBack={() => {}} />);
    const nav = screen.getByRole('navigation', { name: 'Settings navigation' });
    // Find the "About" button within the nav
    const navButtons = nav.querySelectorAll('button');
    const aboutNavButton = Array.from(navButtons).find(btn => btn.textContent?.includes('About'));
    expect(aboutNavButton).toBeDefined();
    fireEvent.click(aboutNavButton!);
    expect(aboutNavButton!.getAttribute('aria-selected')).toBe('true');
  });
});
