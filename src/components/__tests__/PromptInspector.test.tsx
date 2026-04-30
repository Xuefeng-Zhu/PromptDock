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

  it('renders tags with # prefix', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('#summarization')).toBeDefined();
    expect(screen.getByText('#writing')).toBeDefined();
  });

  it('renders metadata rows', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('Last used')).toBeDefined();
    expect(screen.getByText('Created')).toBeDefined();
    expect(screen.getByText('Updated')).toBeDefined();
    expect(screen.getByText('Folder')).toBeDefined();
    expect(screen.getByText('Writing')).toBeDefined();
  });

  it('renders the prompt body section with Copy button', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByText('Prompt')).toBeDefined();
    expect(screen.getByText('Copy')).toBeDefined();
    expect(screen.getByText(/Summarize the following text/)).toBeDefined();
  });

  it('renders collapsible Variables section when variables exist', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={['audience', 'text', 'format']} />
    );
    expect(screen.getByText('Variables (3)')).toBeDefined();
  });

  it('renders favorite star and more options buttons', () => {
    render(
      <PromptInspector prompt={mockPrompt} folder={mockFolder} variables={[]} />
    );
    expect(screen.getByRole('button', { name: /favorites/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'More options' })).toBeDefined();
  });
});
