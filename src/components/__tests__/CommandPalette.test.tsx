// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommandPalette } from '../prompt-search';
import { MOCK_PROMPTS } from '../../data/mock-data';

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const defaultProps = {
  prompts: MOCK_PROMPTS,
  isOpen: true,
  onClose: vi.fn(),
  onSelectPrompt: vi.fn(),
};

describe('CommandPalette', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CommandPalette {...defaultProps} isOpen={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog with search input when isOpen is true', () => {
    render(<CommandPalette {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const input = screen.getByLabelText('Search prompts');
    expect(input).toBeDefined();
  });

  it('auto-focuses the search input on open', async () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Search prompts');
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  it('displays all prompts when search query is empty', () => {
    render(<CommandPalette {...defaultProps} />);
    for (const prompt of MOCK_PROMPTS) {
      expect(screen.getByText(prompt.title)).toBeDefined();
    }
  });

  it('filters results as user types', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Search prompts');
    fireEvent.change(input, { target: { value: 'Summarize' } });
    expect(screen.getByText('Summarize Text')).toBeDefined();
    expect(screen.queryByText('Code Review Assistant')).toBeNull();
  });

  it('filters results by tag match', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Search prompts');
    fireEvent.change(input, { target: { value: 'ideation' } });
    expect(screen.getByText('Generate Product Ideas')).toBeDefined();
    expect(screen.queryByText('Summarize Text')).toBeNull();
  });

  it('shows "No prompts found" when no results match', () => {
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByLabelText('Search prompts');
    fireEvent.change(input, { target: { value: 'zzzznonexistent' } });
    expect(screen.getByText('No prompts found')).toBeDefined();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<CommandPalette {...defaultProps} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('selects highlighted prompt when Enter is pressed', () => {
    const onSelectPrompt = vi.fn();
    render(
      <CommandPalette {...defaultProps} onSelectPrompt={onSelectPrompt} />,
    );
    const dialog = screen.getByRole('dialog');
    // First prompt is highlighted by default
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onSelectPrompt).toHaveBeenCalledTimes(1);
    expect(onSelectPrompt).toHaveBeenCalledWith(MOCK_PROMPTS[0]);
  });

  it('moves highlight down with ArrowDown and selects with Enter', () => {
    const onSelectPrompt = vi.fn();
    render(
      <CommandPalette {...defaultProps} onSelectPrompt={onSelectPrompt} />,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onSelectPrompt).toHaveBeenCalledWith(MOCK_PROMPTS[1]);
  });

  it('moves highlight up with ArrowUp', () => {
    const onSelectPrompt = vi.fn();
    render(
      <CommandPalette {...defaultProps} onSelectPrompt={onSelectPrompt} />,
    );
    const dialog = screen.getByRole('dialog');
    // Move down twice, then up once → should be at index 1
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'ArrowUp' });
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onSelectPrompt).toHaveBeenCalledWith(MOCK_PROMPTS[1]);
  });

  it('clamps highlight at top (ArrowUp does not go below 0)', () => {
    const onSelectPrompt = vi.fn();
    render(
      <CommandPalette {...defaultProps} onSelectPrompt={onSelectPrompt} />,
    );
    const dialog = screen.getByRole('dialog');
    // Press ArrowUp at index 0 — should stay at 0
    fireEvent.keyDown(dialog, { key: 'ArrowUp' });
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onSelectPrompt).toHaveBeenCalledWith(MOCK_PROMPTS[0]);
  });

  it('clamps highlight at bottom (ArrowDown does not exceed list length)', () => {
    const onSelectPrompt = vi.fn();
    render(
      <CommandPalette {...defaultProps} onSelectPrompt={onSelectPrompt} />,
    );
    const dialog = screen.getByRole('dialog');
    // Press ArrowDown many times — should clamp at last item
    for (let i = 0; i < MOCK_PROMPTS.length + 5; i++) {
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    }
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onSelectPrompt).toHaveBeenCalledWith(
      MOCK_PROMPTS[MOCK_PROMPTS.length - 1],
    );
  });

  it('shows keyboard shortcut hints', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByText('↑↓')).toBeDefined();
    expect(screen.getByText('navigate')).toBeDefined();
    expect(screen.getByText('Enter')).toBeDefined();
    expect(screen.getByText('select')).toBeDefined();
    expect(screen.getByText('Esc')).toBeDefined();
    expect(screen.getByText('close')).toBeDefined();
  });

  it('closes when clicking the backdrop', () => {
    const onClose = vi.fn();
    render(<CommandPalette {...defaultProps} onClose={onClose} />);
    const backdrop = screen.getByTestId('command-palette-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the dialog', () => {
    const onClose = vi.fn();
    render(<CommandPalette {...defaultProps} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('selects a prompt when clicking on a result item', () => {
    const onSelectPrompt = vi.fn();
    render(
      <CommandPalette {...defaultProps} onSelectPrompt={onSelectPrompt} />,
    );
    fireEvent.click(screen.getByText('Code Review Assistant'));
    expect(onSelectPrompt).toHaveBeenCalledWith(MOCK_PROMPTS[3]);
  });

  it('renders results with role="option" and aria-selected', () => {
    render(<CommandPalette {...defaultProps} />);
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(MOCK_PROMPTS.length);
    // First option should be highlighted (aria-selected="true")
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
  });
});
