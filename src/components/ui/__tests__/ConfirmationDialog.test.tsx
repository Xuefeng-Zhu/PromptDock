// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationDialog } from '../ConfirmationDialog';

describe('ConfirmationDialog', () => {
  it('renders labelled dialog content and actions', () => {
    render(
      <ConfirmationDialog
        confirmLabel="Delete item"
        description="This cannot be undone."
        idPrefix="delete-item"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete item?"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Delete item?' })).toBeDefined();
    expect(screen.getByText('This cannot be undone.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Delete item' })).toBeDefined();
  });

  it('calls cancel and confirm handlers', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmationDialog
        confirmLabel="Delete item"
        description="This cannot be undone."
        idPrefix="delete-item"
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Delete item?"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete item' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
