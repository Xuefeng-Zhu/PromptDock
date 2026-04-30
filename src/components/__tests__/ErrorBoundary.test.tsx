// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// ─── Helper: a component that throws on render ────────────────────────────────

function ThrowingComponent({ message }: { message: string }): React.ReactNode {
  throw new Error(message);
}

function GoodComponent() {
  return <p>All good</p>;
}

// Suppress console.error noise from React error boundary logging
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeDefined();
  });

  it('displays fallback UI with "Something went wrong" when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Test crash" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });

  it('displays the error message in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Render failure" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Render failure')).toBeDefined();
  });

  it('displays a Reload button in the fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Crash" />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('button', { name: /reload/i })).toBeDefined();
  });

  it('calls window.location.reload when Reload button is clicked', () => {
    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowingComponent message="Crash" />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByRole('button', { name: /reload/i }));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error page</div>}>
        <ThrowingComponent message="Crash" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom error page')).toBeDefined();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('logs the error via componentDidCatch', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent message="Logged error" />
      </ErrorBoundary>,
    );

    // React calls console.error multiple times; our componentDidCatch also calls it
    const boundaryLog = consoleSpy.mock.calls.find(
      (call) => call[0] === 'ErrorBoundary caught:',
    );
    expect(boundaryLog).toBeDefined();
  });
});
