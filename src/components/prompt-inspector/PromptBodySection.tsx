import { Copy } from 'lucide-react';
import type { PromptRecipe } from '../../types/index';
import { PromptHighlightedBody } from './PromptHighlightedBody';

interface PromptBodySectionProps {
  onCopyBody?: (body: string, promptId?: string) => void;
  prompt: PromptRecipe;
}

export function PromptBodySection({ onCopyBody, prompt }: PromptBodySectionProps) {
  return (
    <div className="px-5 pb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Prompt
        </h3>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-gray-100 hover:text-[var(--color-text-main)] transition-colors"
          aria-label="Copy prompt body"
          onClick={() => onCopyBody?.(prompt.body, prompt.id)}
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>
      </div>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3 max-h-64 overflow-y-auto">
        <PromptHighlightedBody text={prompt.body} />
      </div>
    </div>
  );
}
