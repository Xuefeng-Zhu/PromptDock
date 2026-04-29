import type { PromptRecipe } from '../types';
import type { ISearchEngine } from './interfaces';

export class SearchEngine implements ISearchEngine {
  search(prompts: PromptRecipe[], query: string): PromptRecipe[] {
    const active = prompts.filter((p) => !p.archived);
    if (!query.trim()) return active;

    const q = query.toLowerCase();
    return active
      .map((p) => ({ prompt: p, score: this.score(p, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.prompt);
  }

  private score(p: PromptRecipe, q: string): number {
    let score = 0;
    if (p.title.toLowerCase().includes(q)) score += 100;
    if (p.tags.some((t) => t.toLowerCase().includes(q))) score += 50;
    if (p.description.toLowerCase().includes(q)) score += 25;
    if (p.body.toLowerCase().includes(q)) score += 10;
    return score;
  }
}
