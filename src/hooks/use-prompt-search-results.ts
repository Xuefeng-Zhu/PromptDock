import { useMemo } from 'react';
import type { PromptRecipe } from '../types/index';
import { SearchEngine } from '../services/search-engine';

const promptSearchEngine = new SearchEngine();

interface UsePromptSearchResultsOptions {
  fields?: Array<'title' | 'description' | 'tags' | 'body'>;
  includeArchived?: boolean;
}

export function searchPromptResults(
  prompts: PromptRecipe[],
  query: string,
  options?: UsePromptSearchResultsOptions,
): PromptRecipe[] {
  return promptSearchEngine.search(prompts, query, options);
}

export function usePromptSearchResults(
  prompts: PromptRecipe[],
  query: string,
  options?: UsePromptSearchResultsOptions,
): PromptRecipe[] {
  return useMemo(
    () => searchPromptResults(prompts, query, options),
    [options, prompts, query],
  );
}
