import type { PromptRecipe, RenderResult, ImportResult, DuplicateInfo, AuthResult, AuthUser } from '../types';

export interface IVariableParser {
  parse(template: string): string[];
}

export interface IPromptRenderer {
  render(template: string, values: Record<string, string>): RenderResult;
}

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
