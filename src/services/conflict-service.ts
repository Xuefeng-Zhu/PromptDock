import type { PromptRecipe, PromptConflict } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ConflictService {
  detectConflict(local: PromptRecipe, remote: PromptRecipe): PromptConflict | null {
    if (local.version === remote.version) return null;
    if (local.updatedAt.getTime() === remote.updatedAt.getTime()) return null;
    return {
      id: uuidv4(),
      promptId: local.id,
      localVersion: local,
      remoteVersion: remote,
      detectedAt: new Date(),
      resolvedAt: null,
    };
  }

  resolveKeepLocal(conflict: PromptConflict): PromptRecipe {
    return { ...conflict.localVersion, version: Math.max(conflict.localVersion.version, conflict.remoteVersion.version) + 1 };
  }

  resolveKeepRemote(conflict: PromptConflict): PromptRecipe {
    return conflict.remoteVersion;
  }
}
