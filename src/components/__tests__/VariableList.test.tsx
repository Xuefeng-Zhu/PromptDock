// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VariableList } from '../prompt-variables';

describe('VariableList', () => {
  it('renders variable names wrapped in double braces', () => {
    render(<VariableList variables={['name', 'tone']} />);
    expect(screen.getByText('{{name}}')).toBeDefined();
    expect(screen.getByText('{{tone}}')).toBeDefined();
  });

  it('renders the "Variables" heading', () => {
    render(<VariableList variables={['audience']} />);
    expect(screen.getByText('Variables')).toBeDefined();
  });

  it('renders nothing when the variables array is empty', () => {
    const { container } = render(<VariableList variables={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders one list item per variable', () => {
    const { container } = render(
      <VariableList variables={['language', 'code', 'format']} />
    );
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(3);
  });

  it('uses monospace font for variable names', () => {
    const { container } = render(<VariableList variables={['text']} />);
    const item = container.querySelector('li');
    expect(item?.className).toContain('font-mono');
  });
});
