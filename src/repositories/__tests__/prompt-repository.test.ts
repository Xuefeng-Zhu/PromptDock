import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import type { PromptRecipe } from '../../types';

// Mock the local storage backend
const mockItems: PromptRecipe[] = [];
vi.mock('../local-storage-backend', () => ({
  localStorageBackend: {
    readAll: vi.fn(async () => [...mockItems]),
    writeAll: vi.fn(async (_store: string, items: PromptRecipe[]) => {
      mockItems.length = 0;
      mockItems.push(...items);
    }),
    read: vi.fn(async () => null),
    write: vi.fn(async () => {}),
  },
}));

import { PromptRepository } from '../prompt-repository';

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'test-id', workspaceId: 'w1', title: 'Test', description: 'desc', body: 'body',
    tags: [], folderId: null, favorite: false, archived: false, archivedAt: null,
    createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'), lastUsedAt: null,
    createdBy: 'local', version: 1,
    ...overrides,
  };
}

describe('PromptRepository', () => {
  let repo: PromptRepository;

  beforeEach(() => {
    mockItems.length = 0;
    repo = new PromptRepository();
  });

  it('creates a prompt with generated id and timestamps', async () => {
    const result = await repo.create({
      workspaceId: 'w1', title: 'New', description: '', body: 'text',
      tags: [], folderId: null, favorite: false, archived: false, archivedAt: null,
      lastUsedAt: null, createdBy: 'local', version: 1,
    });
    expect(result.id).toBeTruthy();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('updates a prompt and sets updatedAt', async () => {
    const original = makePrompt();
    mockItems.push(original);
    const before = original.updatedAt;
    // Small delay to ensure timestamp differs
    await new Promise((r) => setTimeout(r, 5));
    const updated = await repo.update('test-id', { title: 'Updated' });
    expect(updated.title).toBe('Updated');
    expect(updated.updatedAt.getTime()).toBeGreaterThan(before.getTime());
  });

  it('duplicates with "Copy of" prefix', async () => {
    mockItems.push(makePrompt({ title: 'Original' }));
    const dup = await repo.duplicate('test-id');
    expect(dup.title).toBe('Copy of Original');
    expect(dup.id).not.toBe('test-id');
  });

  it('toggles favorite', async () => {
    mockItems.push(makePrompt({ favorite: false }));
    const toggled = await repo.toggleFavorite('test-id');
    expect(toggled.favorite).toBe(true);
  });

  it('archives and restores', async () => {
    mockItems.push(makePrompt());
    await repo.softDelete('test-id');
    let prompt = mockItems.find((p) => p.id === 'test-id')!;
    expect(prompt.archived).toBe(true);
    expect(prompt.archivedAt).toBeTruthy();

    await repo.restore('test-id');
    prompt = mockItems.find((p) => p.id === 'test-id')!;
    expect(prompt.archived).toBe(false);
    expect(prompt.archivedAt).toBeNull();
  });

  // Property 3: Archive/Restore round-trip
  it('P3: archive then restore returns to non-archived state', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        async (title) => {
          mockItems.length = 0;
          mockItems.push(makePrompt({ title }));
          await repo.softDelete('test-id');
          let p = mockItems.find((x) => x.id === 'test-id')!;
          expect(p.archived).toBe(true);
          expect(p.archivedAt).not.toBeNull();
          await repo.restore('test-id');
          p = mockItems.find((x) => x.id === 'test-id')!;
          expect(p.archived).toBe(false);
          expect(p.archivedAt).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 14: Update sets updatedAt
  it('P14: update always advances updatedAt', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        async (newTitle) => {
          mockItems.length = 0;
          const original = makePrompt({ updatedAt: new Date('2020-01-01') });
          mockItems.push(original);
          const updated = await repo.update('test-id', { title: newTitle });
          expect(updated.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 15: Duplicate prefixes title
  it('P15: duplicate always prefixes with Copy of', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        async (title) => {
          mockItems.length = 0;
          mockItems.push(makePrompt({ title }));
          const dup = await repo.duplicate('test-id');
          expect(dup.title).toBe(`Copy of ${title}`);
          expect(dup.id).not.toBe('test-id');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 16: Favorite toggle flips boolean
  it('P16: toggle favorite flips the boolean', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (initialFav) => {
          mockItems.length = 0;
          mockItems.push(makePrompt({ favorite: initialFav }));
          const toggled = await repo.toggleFavorite('test-id');
          expect(toggled.favorite).toBe(!initialFav);
        }
      ),
      { numRuns: 100 }
    );
  });
});
