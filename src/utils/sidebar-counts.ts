import type { PromptRecipe } from '../types/index';

// ─── Sidebar Count Types ───────────────────────────────────────────────────────

export interface SidebarFilterCounts {
  total: number;
  favorites: number;
  recent: number;
  archived: number;
}

export interface SidebarCounts extends SidebarFilterCounts {
  folderCounts: Record<string, number>;
  tagCounts: Record<string, number>;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Number of milliseconds in 7 days */
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ─── Computation Functions ─────────────────────────────────────────────────────

/**
 * Compute sidebar filter counts (total, favorites, recent, archived) from a list of prompts.
 * 
 * - Total = non-archived prompts
 * - Favorites = non-archived prompts where favorite === true
 * - Recent = non-archived prompts where lastUsedAt is within 7 days of referenceDate
 * - Archived = prompts where archived === true
 */
export function computeFilterCounts(
  prompts: PromptRecipe[],
  referenceDate: Date = new Date(),
): SidebarFilterCounts {
  let total = 0;
  let favorites = 0;
  let recent = 0;
  let archived = 0;

  const recentThreshold = referenceDate.getTime() - SEVEN_DAYS_MS;

  for (const prompt of prompts) {
    if (prompt.archived) {
      archived++;
    } else {
      total++;
      if (prompt.favorite) {
        favorites++;
      }
      if (prompt.lastUsedAt && prompt.lastUsedAt.getTime() > recentThreshold) {
        recent++;
      }
    }
  }

  return { total, favorites, recent, archived };
}

/**
 * Compute folder counts from a list of prompts.
 * Returns a mapping of folderId → count of non-archived prompts in that folder.
 * Prompts with folderId === null are not included in the mapping.
 */
export function computeFolderCounts(prompts: PromptRecipe[]): Record<string, number> {
  const counts: Record<string, number> = Object.create(null);

  for (const prompt of prompts) {
    if (!prompt.archived && prompt.folderId) {
      counts[prompt.folderId] = (counts[prompt.folderId] ?? 0) + 1;
    }
  }

  return counts;
}

/**
 * Compute tag counts from a list of prompts.
 * Returns a mapping of tag → count of non-archived prompts that include that tag.
 * Every tag present in any non-archived prompt appears in the mapping.
 */
export function computeTagCounts(prompts: PromptRecipe[]): Record<string, number> {
  const counts: Record<string, number> = Object.create(null);

  for (const prompt of prompts) {
    if (!prompt.archived) {
      for (const tag of prompt.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
  }

  return counts;
}

/**
 * Compute all sidebar counts at once (filter counts, folder counts, tag counts).
 */
export function computeSidebarCounts(
  prompts: PromptRecipe[],
  referenceDate: Date = new Date(),
): SidebarCounts {
  const filterCounts = computeFilterCounts(prompts, referenceDate);
  const folderCounts = computeFolderCounts(prompts);
  const tagCounts = computeTagCounts(prompts);

  return {
    ...filterCounts,
    folderCounts,
    tagCounts,
  };
}
