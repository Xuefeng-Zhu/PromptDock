// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagAutocompleteInput } from '../prompt-tags/TagAutocompleteInput';

function renderTagAutocompleteInput(overrides: Partial<Parameters<typeof TagAutocompleteInput>[0]> = {}) {
  const props = {
    availableTags: ['Writing', 'Code', 'Research'],
    className: 'relative w-44',
    onBlur: vi.fn(),
    onSubmitTag: vi.fn(),
    onUnhandledKeyDown: vi.fn(),
    onValueChange: vi.fn(),
    selectedTags: [],
    value: 'w',
    ...overrides,
  };

  render(<TagAutocompleteInput {...props} />);

  return props;
}

describe('TagAutocompleteInput', () => {
  it('shows matching unselected tags as listbox options', () => {
    renderTagAutocompleteInput({ selectedTags: ['Code'] });

    expect(screen.getByRole('option', { name: '#Writing' })).toBeDefined();
    expect(screen.queryByRole('option', { name: '#Code' })).toBeNull();
  });

  it('submits the highlighted quick tag with Enter', () => {
    const props = renderTagAutocompleteInput();

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Add tag' }), {
      key: 'Enter',
    });

    expect(props.onSubmitTag).toHaveBeenCalledWith('Writing');
    expect(props.onUnhandledKeyDown).not.toHaveBeenCalled();
  });

  it('delegates non-listbox keys to the parent', () => {
    const props = renderTagAutocompleteInput();

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Add tag' }), {
      key: 'Escape',
    });

    expect(props.onUnhandledKeyDown).toHaveBeenCalledTimes(1);
  });

  it('delegates Enter when there are no quick matches', () => {
    const props = renderTagAutocompleteInput({ value: 'missing' });

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Add tag' }), {
      key: 'Enter',
    });

    expect(props.onUnhandledKeyDown).toHaveBeenCalledTimes(1);
    expect(props.onSubmitTag).not.toHaveBeenCalled();
  });
});
