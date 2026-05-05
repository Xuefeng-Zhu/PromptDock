import { describe, expect, it } from 'vitest';
import { formatFolderLabel } from '../folder-label';

describe('formatFolderLabel', () => {
  it('formats generated folder ids without the timestamp suffix', () => {
    expect(formatFolderLabel('folder-work-1777560341621')).toBe('Work');
    expect(formatFolderLabel('folder-client-work-1700000000000')).toBe('Client Work');
  });

  it('formats stable folder ids', () => {
    expect(formatFolderLabel('folder-engineering')).toBe('Engineering');
    expect(formatFolderLabel('folder-product-docs')).toBe('Product Docs');
  });

  it('preserves non-generated long numeric suffixes', () => {
    expect(formatFolderLabel('folder-client-2024010101')).toBe('Client 2024010101');
    expect(formatFolderLabel('folder-invoice-202401')).toBe('Invoice 202401');
  });
});
