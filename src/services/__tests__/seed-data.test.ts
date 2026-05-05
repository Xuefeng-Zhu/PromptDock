import { describe, it, expect, vi } from 'vitest';
import type { PromptRecipe } from '../../types/index';
import type { IPromptRepository } from '../../repositories/interfaces';
import { seedDefaultPrompts, SEED_RECIPES } from '../seed-data';

// ─── Mock Repository ───────────────────────────────────────────────────────────

function createMockRepo(existingPrompts: PromptRecipe[] = []): IPromptRepository {
  const prompts = [...existingPrompts];

  return {
    getAll: vi.fn(async () => prompts),
    create: vi.fn(async (recipe) => {
      const created: PromptRecipe = {
        ...recipe,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prompts.push(created);
      return created;
    }),
    getById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    softDelete: vi.fn(),
    restore: vi.fn(),
    duplicate: vi.fn(),
    toggleFavorite: vi.fn(),
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Seed Data Service', () => {
  describe('SEED_RECIPES', () => {
    it('should contain exactly 6 seed recipes', () => {
      expect(SEED_RECIPES).toHaveLength(6);
    });

    it('should include all expected recipe titles', () => {
      const titles = SEED_RECIPES.map((r) => r.title);
      expect(titles).toEqual([
        'Summarize Text',
        'Rewrite in Clear English',
        'Generate Product Ideas',
        'Code Review Assistant',
        'Email Draft',
        'Meeting Notes Extractor',
      ]);
    });

    it('should set workspaceId to local for all recipes', () => {
      for (const recipe of SEED_RECIPES) {
        expect(recipe.workspaceId).toBe('local');
      }
    });

    it('should set createdBy to local for all recipes', () => {
      for (const recipe of SEED_RECIPES) {
        expect(recipe.createdBy).toBe('local');
      }
    });

    it('should have non-empty body with {{variable}} placeholders for each recipe', () => {
      const variablePattern = /\{\{[a-z_]+\}\}/;
      for (const recipe of SEED_RECIPES) {
        expect(recipe.body.length).toBeGreaterThan(0);
        expect(recipe.body).toMatch(variablePattern);
      }
    });

    it('should have non-empty tags for each recipe', () => {
      for (const recipe of SEED_RECIPES) {
        expect(recipe.tags.length).toBeGreaterThan(0);
      }
    });

    it('should have all recipes non-archived and non-favorited', () => {
      for (const recipe of SEED_RECIPES) {
        expect(recipe.archived).toBe(false);
        expect(recipe.archivedAt).toBeNull();
        expect(recipe.favorite).toBe(false);
      }
    });
  });

  describe('seedDefaultPrompts', () => {
    it('should create all 6 seed recipes when workspace is empty', async () => {
      const repo = createMockRepo();

      await seedDefaultPrompts(repo);

      expect(repo.getAll).toHaveBeenCalledWith('local');
      expect(repo.create).toHaveBeenCalledTimes(6);
    });

    it('should not create any recipes when workspace already has prompts', async () => {
      const existingPrompt: PromptRecipe = {
        id: 'existing-1',
        workspaceId: 'local',
        title: 'Existing Prompt',
        description: 'Already here',
        body: 'Some body',
        tags: ['existing'],
        folderId: null,
        favorite: false,
        archived: false,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        createdBy: 'local',
        version: 1,
      };
      const repo = createMockRepo([existingPrompt]);

      await seedDefaultPrompts(repo);

      expect(repo.getAll).toHaveBeenCalledWith('local');
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should pass correct recipe data to repo.create', async () => {
      const repo = createMockRepo();

      await seedDefaultPrompts(repo);

      const firstCall = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(firstCall.title).toBe('Summarize Text');
      expect(firstCall.workspaceId).toBe('local');
      expect(firstCall.createdBy).toBe('local');
    });
  });
});
