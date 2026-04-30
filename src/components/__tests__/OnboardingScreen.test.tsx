// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingScreen } from '../OnboardingScreen';

describe('OnboardingScreen', () => {
  it('renders the welcome heading', () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    expect(screen.getByText('Welcome to PromptDock')).toBeDefined();
  });

  it('renders 3 option cards', () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    expect(screen.getByText('Start locally')).toBeDefined();
    expect(screen.getByText('Enable sync')).toBeDefined();
    expect(screen.getByText('Sign in')).toBeDefined();
  });

  it('renders 4 benefit cards', () => {
    render(<OnboardingScreen onComplete={() => {}} />);
    expect(screen.getByText('Store prompt recipes')).toBeDefined();
    expect(screen.getByText('Fill variables')).toBeDefined();
    expect(screen.getByText('Paste anywhere')).toBeDefined();
    expect(screen.getByText('Works offline')).toBeDefined();
  });

  it('calls onComplete with "local" when Start locally is clicked', () => {
    const handleComplete = vi.fn();
    render(<OnboardingScreen onComplete={handleComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start locally' }));
    expect(handleComplete).toHaveBeenCalledWith('local');
  });

  it('calls onComplete with "sync" when Enable sync is clicked', () => {
    const handleComplete = vi.fn();
    render(<OnboardingScreen onComplete={handleComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enable sync' }));
    expect(handleComplete).toHaveBeenCalledWith('sync');
  });

  it('calls onComplete with "signin" when Sign in is clicked', () => {
    const handleComplete = vi.fn();
    render(<OnboardingScreen onComplete={handleComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(handleComplete).toHaveBeenCalledWith('signin');
  });
});
