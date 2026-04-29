import type { PromptRecipe, ImportResult, DuplicateInfo } from '../types';
import type { IImportExportService } from './interfaces';

export class ImportExportService implements IImportExportService {
  exportToJSON(prompts: PromptRecipe[]): string {
    const nonArchived = prompts.filter((p) => !p.archived);
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      prompts: nonArchived.map((p) => ({
        title: p.title,
        description: p.description,
        body: p.body,
        tags: p.tags,
        folderId: p.folderId,
        favorite: p.favorite,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
      })),
    }, null, 2);
  }

  importFromJSON(json: string): ImportResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      return { success: false, errors: ['Invalid JSON'] };
    }

    const errors: string[] = [];
    const obj = parsed as Record<string, unknown>;

    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return { success: false, errors: ['Root must be an object'] };
    }
    if (obj.version !== '1.0') errors.push('Missing or invalid version field');
    if (typeof obj.exportedAt !== 'string') errors.push('Missing exportedAt field');
    if (!Array.isArray(obj.prompts)) {
      errors.push('Missing prompts array');
      return { success: false, errors };
    }

    const prompts: PromptRecipe[] = [];
    for (let i = 0; i < (obj.prompts as unknown[]).length; i++) {
      const p = (obj.prompts as Record<string, unknown>[])[i];
      if (typeof p.title !== 'string') { errors.push(`Prompt at index ${i}: missing title`); continue; }
      if (typeof p.body !== 'string') { errors.push(`Prompt at index ${i}: missing body`); continue; }
      prompts.push({
        id: '',
        workspaceId: '',
        title: p.title,
        description: typeof p.description === 'string' ? p.description : '',
        body: p.body,
        tags: Array.isArray(p.tags) ? p.tags.filter((t): t is string => typeof t === 'string') : [],
        folderId: typeof p.folderId === 'string' ? p.folderId : null,
        favorite: typeof p.favorite === 'boolean' ? p.favorite : false,
        archived: false,
        archivedAt: null,
        createdAt: typeof p.createdAt === 'string' ? new Date(p.createdAt) : new Date(),
        updatedAt: typeof p.updatedAt === 'string' ? new Date(p.updatedAt) : new Date(),
        lastUsedAt: null,
        createdBy: 'local',
        version: 1,
      });
    }

    if (errors.length > 0) return { success: false, errors };
    return { success: true, prompts };
  }

  detectDuplicates(incoming: PromptRecipe[], existing: PromptRecipe[]): DuplicateInfo[] {
    const dupes: DuplicateInfo[] = [];
    for (const inc of incoming) {
      for (const ext of existing) {
        const titleMatch = inc.title === ext.title;
        const bodyMatch = inc.body === ext.body;
        if (titleMatch && bodyMatch) dupes.push({ incoming: inc, existing: ext, matchedOn: 'both' });
        else if (titleMatch) dupes.push({ incoming: inc, existing: ext, matchedOn: 'title' });
        else if (bodyMatch) dupes.push({ incoming: inc, existing: ext, matchedOn: 'body' });
      }
    }
    return dupes;
  }
}
