// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLayoutMetrics } from '../../hooks/use-layout-metrics';
import { AccountMenuPopover } from '../top-bar/AccountMenuPopover';

vi.mock('../../hooks/use-layout-metrics', () => ({ useLayoutMetrics: vi.fn() }));
vi.mock('../account', () => ({ AccountPanel: () => <p>Local account controls</p> }));

const refresh = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useLayoutMetrics).mockReturnValue({
    metrics: {
      innerWidth: 617,
      innerHeight: 813,
      clientWidth: 600,
      scrollWidth: 674,
      horizontalOverflow: 74,
    },
    refresh,
  });
});

describe('Account layout details', () => {
  it('shows measurements only after expanding details and preserves the nonmodal account controls', () => {
    render(<AccountMenuPopover mode="local" userId={null} />);
    expect(screen.queryByText('Layout details')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    const popover = screen.getByRole('dialog', { name: 'Account' });
    expect(popover.getAttribute('aria-modal')).toBeNull();
    expect(screen.getByText('Local account controls')).toBeDefined();
    expect(screen.queryByLabelText('Browser inner width')).toBeNull();
    expect(useLayoutMetrics).toHaveBeenLastCalledWith(false);

    const details = screen.getByText('Layout details').closest('details')!;
    details.open = true;
    fireEvent(details, new Event('toggle'));
    expect(useLayoutMetrics).toHaveBeenLastCalledWith(true);
    expect(screen.getByLabelText('Browser inner width').textContent).toBe('617');
    expect(screen.getByLabelText('Browser inner height').textContent).toBe('813');
    expect(screen.getByLabelText('Document client width').textContent).toBe('600');
    expect(screen.getByLabelText('Document scroll width').textContent).toBe('674');
    expect(screen.getByLabelText('Horizontal overflow').textContent).toBe('74');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh measurements' }));
    expect(refresh).toHaveBeenCalledOnce();

    details.open = false;
    fireEvent(details, new Event('toggle'));
    expect(screen.queryByLabelText('Browser inner width')).toBeNull();
    expect(useLayoutMetrics).toHaveBeenLastCalledWith(false);
    fireEvent.keyDown(popover, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Account' })).toBeNull();
  });
});
