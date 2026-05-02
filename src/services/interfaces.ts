import type {
  PromptRecipe,
  RenderResult,
  ImportResult,
  DuplicateInfo,
  AuthResult,
  AuthUser,
} from '../types/index';

// ─── Service Interfaces ───────────────────────────────────────────────────────

/** Extract unique variable names in order of first appearance */
export interface IVariableParser {
  parse(template: string): string[];
}

/**
 * Substitute variables into template.
 * Returns rendered text or validation error with missing variable names.
 */
export interface IPromptRenderer {
  render(template: string, values: Record<string, string>): RenderResult;
}

/**
 * Search prompts by query. Returns ranked results.
 * Empty query returns all prompts in the selected archived scope.
 */
export interface ISearchEngine {
  search(
    prompts: PromptRecipe[],
    query: string,
    options?: {
      includeArchived?: boolean;
      fields?: Array<'title' | 'tags' | 'description' | 'body'>;
    },
  ): PromptRecipe[];
}

export interface IImportExportService {
  exportToJSON(prompts: PromptRecipe[]): string;
  importFromJSON(json: string): ImportResult;
  detectDuplicates(incoming: PromptRecipe[], existing: PromptRecipe[]): DuplicateInfo[];
}

export interface IAuthService {
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;
  signOut(): Promise<void>;
  restoreSession(): Promise<AuthResult | null>;
  sendPasswordReset(email: string): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}
