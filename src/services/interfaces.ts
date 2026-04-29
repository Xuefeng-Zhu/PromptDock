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
 * Empty query returns all non-archived prompts.
 */
export interface ISearchEngine {
  search(prompts: PromptRecipe[], query: string): PromptRecipe[];
}

export interface IImportExportService {
  exportToJSON(prompts: PromptRecipe[]): string;
  importFromJSON(json: string): ImportResult;
  detectDuplicates(incoming: PromptRecipe[], existing: PromptRecipe[]): DuplicateInfo[];
}

export interface IAuthService {
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  restoreSession(): Promise<AuthResult | null>;
  sendPasswordReset(email: string): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
}
