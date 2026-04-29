import type { PromptRecipe } from '../types/index';
import type { ISearchEngine } from './interfaces';

/**
 * Field priority weights for search ranking.
 * Higher weight = higher priority in results.
 */
const FIELD_PRIORITY = {
  title: 4,
  tags: 3,
  description: 2,
  body: 1,
} as const;

/**
 * Local in-memory search engine for PromptRecipe collections.
 * Performs case-insensitive matching across title, tags, description, and body fields.
 * Results are ranked by the highest-priority field that matches.
 * Archived prompts are always excluded from results.
 */
export class SearchEngine implements ISearchEngine {
  /**
   * Search prompts by query string.
   * - Empty query returns all non-archived prompts.
   * - Non-empty query performs case-insensitive matching and ranks by field priority.
   * - Archived prompts are always excluded.
   */
  search(prompts: PromptRecipe[], query: string): PromptRecipe[] {
    const nonArchived = prompts.filter((p) => !p.archived);

    const trimmed = query.trim();
    if (trimmed === '') {
      return nonArchived;
    }

    const lowerQuery = trimmed.toLowerCase();

    const scored: Array<{ prompt: PromptRecipe; score: number }> = [];

    for (const prompt of nonArchived) {
      const score = this.scorePrompt(prompt, lowerQuery);
      if (score > 0) {
        scored.push({ prompt, score });
      }
    }

    // Sort descending by score (highest priority match first)
    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.prompt);
  }

  /**
   * Score a prompt against a lowercase query.
   * Returns the highest field-priority weight among matching fields, or 0 if no match.
   */
  private scorePrompt(prompt: PromptRecipe, lowerQuery: string): number {
    let bestScore = 0;

    // Check title
    if (prompt.title.toLowerCase().includes(lowerQuery)) {
      bestScore = Math.max(bestScore, FIELD_PRIORITY.title);
    }

    // Check tags
    if (prompt.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
      bestScore = Math.max(bestScore, FIELD_PRIORITY.tags);
    }

    // Check description
    if (prompt.description.toLowerCase().includes(lowerQuery)) {
      bestScore = Math.max(bestScore, FIELD_PRIORITY.description);
    }

    // Check body
    if (prompt.body.toLowerCase().includes(lowerQuery)) {
      bestScore = Math.max(bestScore, FIELD_PRIORITY.body);
    }

    return bestScore;
  }
}
