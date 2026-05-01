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

type SearchField = keyof typeof FIELD_PRIORITY;

export interface SearchOptions {
  includeArchived?: boolean;
  fields?: SearchField[];
}

/**
 * Local in-memory search engine for PromptRecipe collections.
 * Performs case-insensitive matching across title, tags, description, and body fields.
 * Results are ranked by the highest-priority field that matches.
 * Archived prompts are excluded by default and can be included explicitly.
 */
export class SearchEngine implements ISearchEngine {
  /**
   * Search prompts by query string.
   * - Empty query returns all prompts in the selected archived scope.
   * - Non-empty query performs case-insensitive matching and ranks by field priority.
   * - Archived prompts are excluded unless includeArchived is true.
   */
  search(
    prompts: PromptRecipe[],
    query: string,
    options: SearchOptions = {},
  ): PromptRecipe[] {
    const {
      includeArchived = false,
      fields = ['title', 'tags', 'description', 'body'],
    } = options;
    const fieldSet = new Set<SearchField>(fields);
    const searchable = includeArchived ? prompts : prompts.filter((p) => !p.archived);

    const trimmed = query.trim();
    if (trimmed === '') {
      return searchable;
    }

    const lowerQuery = trimmed.toLowerCase();

    const scored: Array<{ prompt: PromptRecipe; score: number }> = [];

    for (const prompt of searchable) {
      const score = this.scorePrompt(prompt, lowerQuery, fieldSet);
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
  private scorePrompt(
    prompt: PromptRecipe,
    lowerQuery: string,
    fields: Set<SearchField>,
  ): number {
    let bestScore = 0;

    // Check title
    if (fields.has('title') && prompt.title.toLowerCase().includes(lowerQuery)) {
      bestScore = Math.max(bestScore, FIELD_PRIORITY.title);
    }

    // Check tags
    if (
      fields.has('tags') &&
      prompt.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    ) {
      bestScore = Math.max(bestScore, FIELD_PRIORITY.tags);
    }

    // Check description
    if (
      fields.has('description') &&
      prompt.description.toLowerCase().includes(lowerQuery)
    ) {
      bestScore = Math.max(bestScore, FIELD_PRIORITY.description);
    }

    // Check body
    if (fields.has('body') && prompt.body.toLowerCase().includes(lowerQuery)) {
      bestScore = Math.max(bestScore, FIELD_PRIORITY.body);
    }

    return bestScore;
  }
}
