import type { PromptRecipe } from '../types/index';
import type { IPromptRepository } from '../repositories/interfaces';

// ─── Seed Data ─────────────────────────────────────────────────────────────────
// Sample Prompt_Recipes created in the default local workspace on first launch.
// Each recipe demonstrates the {{variable_name}} placeholder system with
// realistic, useful templates.

export interface SeedRecipeData
  extends Omit<PromptRecipe, 'id' | 'createdAt' | 'updatedAt'> {}

export const SEED_RECIPES: SeedRecipeData[] = [
  {
    workspaceId: 'local',
    title: 'Summarize Text',
    description:
      'Condense a long piece of text into a concise summary at a chosen detail level.',
    body: `Summarize the following text in {{length}} sentences. Focus on the key points and main arguments.\n\nText to summarize:\n{{text}}\n\nProvide the summary in {{format}} format.`,
    tags: ['summarization', 'writing'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
  },
  {
    workspaceId: 'local',
    title: 'Rewrite in Clear English',
    description:
      'Rewrite complex or jargon-heavy text into plain, easy-to-understand English.',
    body: `Rewrite the following text in clear, simple English suitable for a {{audience}} audience. Maintain the original meaning but remove jargon and complex sentence structures.\n\nOriginal text:\n{{text}}\n\nTone: {{tone}}`,
    tags: ['rewriting', 'clarity', 'writing'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
  },
  {
    workspaceId: 'local',
    title: 'Email Draft',
    description:
      'Draft a professional email based on the purpose, recipient, and key points.',
    body: `Draft a professional email to {{recipient}} regarding {{subject}}.\n\nKey points to cover:\n{{key_points}}\n\nTone: {{tone}}\nDesired length: {{length}}`,
    tags: ['email', 'communication', 'writing'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
  },
  {
    workspaceId: 'local',
    title: 'PromptDock JSON Recipe Generator',
    description:
      'Generate valid JSON that can be pasted into PromptDock\'s From JSON flow.',
    body: `Create a PromptDock prompt recipe as a single valid JSON object.\n\nRequirements:\n- Output JSON only, with no Markdown.\n- Include required fields: "title" and "body".\n- Optional fields may include: "description", "tags", "folder", and "favorite".\n- In the generated prompt body, use PromptDock variables by wrapping variable names in two opening and two closing curly braces.\n- Do not include app-owned fields like id, workspaceId, createdAt, updatedAt, createdBy, version, archived, or lastUsedAt.\n\nPrompt I want to create:\n{{prompt_goal}}\n\nReturn this shape:\n{\n  "title": "...",\n  "description": "...",\n  "body": "...",\n  "tags": ["..."],\n  "folder": "...",\n  "favorite": false\n}`,
    tags: ['promptdock', 'json', 'templates'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
  },
];

/**
 * Populate the default local workspace with seed data on first launch.
 * Checks whether prompts already exist to avoid re-seeding.
 */
export async function seedDefaultPrompts(
  repo: IPromptRepository,
): Promise<void> {
  const existing = await repo.getAll('local');

  if (existing.length > 0) {
    return; // Workspace already has prompts — skip seeding
  }

  for (const recipe of SEED_RECIPES) {
    await repo.create(recipe);
  }
}
