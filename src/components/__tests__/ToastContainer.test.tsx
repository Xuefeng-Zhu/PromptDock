// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastContainer } from '../feedback';
import { useToastStore } from '../../stores/toast-store';

// Reset toast store state between tests
beforeEach(() => {
  useToastStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastContainer />);
    expect(container.innerHTML).toBe('');
  });

  it('renders an error toast with the correct message', () => {
    act(() => {
      useToastStore.getState().addToast('Something failed', 'error', 0);
    });

    render(<ToastContainer />);
    expect(screen.getByText('Something failed')).toBeDefined();
    expect(screen.getByRole('alert')).toBeDefined();
  });

  it('renders a success toast with the correct message', () => {
    act(() => {
      useToastStore.getState().addToast('Saved successfully', 'success', 0);
    });

    render(<ToastContainer />);
    expect(screen.getByText('Saved successfully')).toBeDefined();
  });

  it('renders an info toast with the correct message', () => {
    act(() => {
      useToastStore.getState().addToast('FYI: update available', 'info', 0);
    });

    render(<ToastContainer />);
    expect(screen.getByText('FYI: update available')).toBeDefined();
  });

  it('renders multiple toasts simultaneously', () => {
    act(() => {
      useToastStore.getState().addToast('Error one', 'error', 0);
      useToastStore.getState().addToast('Success one', 'success', 0);
    });

    render(<ToastContainer />);
    expect(screen.getByText('Error one')).toBeDefined();
    expect(screen.getByText('Success one')).toBeDefined();
  });

  it('removes a toast when the dismiss button is clicked', () => {
    act(() => {
      useToastStore.getState().addToast('Dismissable toast', 'info', 0);
    });

    render(<ToastContainer />);
    expect(screen.getByText('Dismissable toast')).toBeDefined();

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByText('Dismissable toast')).toBeNull();
  });

  it('auto-removes a toast after its duration expires', () => {
    act(() => {
      useToastStore.getState().addToast('Temporary toast', 'info', 3000);
    });

    render(<ToastContainer />);
    expect(screen.getByText('Temporary toast')).toBeDefined();

    // Advance time past the duration
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Temporary toast')).toBeNull();
  });
});

describe('useToastStore', () => {
  it('addToast adds a toast with the correct properties', () => {
    act(() => {
      useToastStore.getState().addToast('Test message', 'error', 0);
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('error');
    expect(toasts[0].id).toBeDefined();
  });

  it('removeToast removes the specified toast', () => {
    act(() => {
      useToastStore.getState().addToast('To remove', 'info', 0);
    });

    const id = useToastStore.getState().toasts[0].id;

    act(() => {
      useToastStore.getState().removeToast(id);
    });

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
