// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncStatusBadge } from '../sync';

describe('SyncStatusBadge', () => {
  it('renders "Local" text for local status', () => {
    render(<SyncStatusBadge status="local" />);
    expect(screen.getByText('Local')).toBeDefined();
  });

  it('renders "Synced" text for synced status', () => {
    render(<SyncStatusBadge status="synced" />);
    expect(screen.getByText('Synced')).toBeDefined();
  });

  it('renders "Offline" text for offline status', () => {
    render(<SyncStatusBadge status="offline" />);
    expect(screen.getByText('Offline')).toBeDefined();
  });

  it('renders an icon alongside the text label (not color alone)', () => {
    const { container } = render(<SyncStatusBadge status="local" />);
    // lucide-react renders SVG icons
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Also has text label
    expect(screen.getByText('Local')).toBeDefined();
  });

  it('applies rounded-full badge styling', () => {
    const { container } = render(<SyncStatusBadge status="synced" />);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.className).toContain('rounded-full');
  });
});
