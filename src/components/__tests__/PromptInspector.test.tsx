// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PromptInspector } from '../PromptInspector';
import { MOCK_PROMPTS, MOCK_FOLDERS } from '../../data/mock-data';

const mockPrompt = MOCK_PROMPTS[0]; // "Summarize Text"
const mockFolder = MOCK_FOLDERS[0]; // "Writing"

describe('PromptInspector', () => {
  it('renders the prompt title and description', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={['audience', 'text', 'format']} />
    );
    expect(screen.getByText('Summarize Text')).toBeDefined();
    expect(screen.getByText(/Condense long text/)).toBeDefined();
  });

  it('renders the folder name', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('Writing')).toBeDefined();
  });

  it('renders tags', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('summarization')).toBeDefined();
    expect(screen.getByText('writing')).toBeDefined();
  });

  it('renders created and last used dates', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText(/Created/)).toBeDefined();
    expect(screen.getByText(/Last used/)).toBeDefined();
  });

  it('renders the body preview', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('Body Preview')).toBeDefined();
    // The body contains the template text
    expect(screen.getByText(/Summarize the following text/)).toBeDefined();
  });

  it('renders the variable list when variables are provided', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={['audience', 'text', 'format']} />
    );
    expect(screen.getByText('Variables')).toBeDefined();
    // VariableList renders variables with {{}} wrapper
    expect(screen.getByText('{{audience}}')).toBeDefined();
    expect(screen.getByText('{{text}}')).toBeDefined();
    expect(screen.getByText('{{format}}')).toBeDefined();
  });
});
