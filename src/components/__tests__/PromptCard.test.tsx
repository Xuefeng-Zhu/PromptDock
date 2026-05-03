// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptCard } from '../prompt-card';
import { MOCK_PROMPTS } from '../../data/mock-data';

const mockPrompt = MOCK_PROMPTS[0]; // "Summarize Text", favorite: true

const defaultProps = {
  prompt: mockPrompt,
  categoryColor: 'bg-purple-100 text-purple-600',
  isSelected: false,
  onSelect: vi.fn(),
  onToggleFavorite: vi.fn(),
};

describe('PromptCard', () => {
  it('renders the prompt title and description', () => {
    render(<PromptCard {...defaultProps} />);
    expect(screen.getByText('Summarize Text')).toBeDefined();
    expect(screen.getByText(/Condense long text/)).toBeDefined();
  });

  it('renders tags as TagPills', () => {
    render(<PromptCard {...defaultProps} />);
    expect(screen.getByText('summarization')).toBeDefined();
    expect(screen.getByText('writing')).toBeDefined();
  });

  it('calls onSelect when the card is clicked', () => {
    const onSelect = vi.fn();
    render(<PromptCard {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('option'));
    expect(onSelect).toHaveBeenCalledWith(mockPrompt.id);
  });

  it('calls onSelect when the focused card receives Enter or Space', () => {
    const onSelect = vi.fn();
    render(<PromptCard {...defaultProps} onSelect={onSelect} />);
    const card = screen.getByRole('option');

    expect(card.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenNthCalledWith(1, mockPrompt.id);
    expect(onSelect).toHaveBeenNthCalledWith(2, mockPrompt.id);
  });

  it('calls onToggleFavorite when the star button is clicked', () => {
    const onToggleFavorite = vi.fn();
    const onSelect = vi.fn();
    render(
      <PromptCard
        {...defaultProps}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /favorites/i }));
    expect(onToggleFavorite).toHaveBeenCalledWith(mockPrompt.id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows selected state with aria-selected', () => {
    render(<PromptCard {...defaultProps} isSelected={true} />);
    const card = screen.getByRole('option');
    expect(card.getAttribute('aria-selected')).toBe('true');
  });

  it('shows unselected state with aria-selected false', () => {
    render(<PromptCard {...defaultProps} isSelected={false} />);
    const card = screen.getByRole('option');
    expect(card.getAttribute('aria-selected')).toBe('false');
  });
});
