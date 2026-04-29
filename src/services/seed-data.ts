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
    title: 'Generate Product Ideas',
    description:
      'Brainstorm creative product ideas for a given industry and target audience.',
    body: `Generate {{count}} creative product ideas for the {{industry}} industry. The target audience is {{target_audience}}.\n\nFor each idea, provide:\n1. Product name\n2. One-sentence description\n3. Key differentiator\n4. Estimated complexity (low/medium/high)`,
    tags: ['brainstorming', 'product', 'ideation'],
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
    title: 'Code Review Assistant',
    description:
      'Get a thorough code review with actionable feedback on a code snippet.',
    body: `Review the following {{language}} code. Focus on:\n- Correctness and potential bugs\n- Performance considerations\n- Readability and naming conventions\n- Security concerns\n\nCode:\n\`\`\`{{language}}\n{{code}}\n\`\`\`\n\nProvide specific, actionable feedback with suggested improvements.`,
    tags: ['code-review', 'development', 'engineering'],
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
    title: 'Meeting Notes Extractor',
    description:
      'Extract structured action items, decisions, and summaries from raw meeting notes.',
    body: `Extract structured information from the following meeting notes.\n\nMeeting notes:\n{{notes}}\n\nPlease provide:\n1. Meeting summary (2-3 sentences)\n2. Key decisions made\n3. Action items with owners: {{attendees}}\n4. Follow-up items for the next meeting`,
    tags: ['meetings', 'productivity', 'organization'],
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
