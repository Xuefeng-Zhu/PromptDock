// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(
      <EmptyState
        icon={<span>📭</span>}
        title="No prompts yet"
        description="Create your first prompt to get started."
      />
    );
    expect(screen.getByText('No prompts yet')).toBeDefined();
  });

  it('renders the description', () => {
    render(
      <EmptyState
        icon={<span>📭</span>}
        title="No prompts yet"
        description="Create your first prompt to get started."
      />
    );
    expect(screen.getByText('Create your first prompt to get started.')).toBeDefined();
  });

  it('renders the icon', () => {
    render(
      <EmptyState
        icon={<span data-testid="empty-icon">📭</span>}
        title="Empty"
        description="Nothing here."
      />
    );
    expect(screen.getByTestId('empty-icon')).toBeDefined();
  });

  it('does not render an action button when action is not provided', () => {
    render(
      <EmptyState
        icon={<span>📭</span>}
        title="Empty"
        description="Nothing here."
      />
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders an action button and calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={<span>📭</span>}
        title="No results"
        description="Try a different search."
        action={{ label: 'Clear filters', onClick: handleClick }}
      />
    );
    const btn = screen.getByRole('button', { name: 'Clear filters' });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
