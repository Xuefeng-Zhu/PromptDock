import { useVariableFill } from '../../hooks/use-variable-fill';
import { VariableFillActions } from './VariableFillActions';
import { VariableFillHeader } from './VariableFillHeader';
import { VariableInputList } from './VariableInputList';
import { VariablePreview } from './VariablePreview';
import type { PromptRecipe, UserSettings } from '../../types/index';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface VariableFillModalProps {
  prompt: PromptRecipe;
  variables: string[];
  onCancel: () => void;
  defaultAction?: UserSettings['defaultAction'];
  onCopy: (renderedText: string) => void | Promise<void>;
  onPaste: (renderedText: string) => void | Promise<void>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Redesigned Variable Fill Modal — displays input fields for each detected
 * variable in a prompt template, shows a live rendered preview, and provides
 * Cancel and primary action buttons with keyboard shortcut hints.
 *
 * Uses a <dialog> element with role="dialog" and aria-modal="true".
 * Auto-focuses the first variable input on open.
 * Closes on Escape key or backdrop click.
 */
export function VariableFillModal({
  prompt,
  variables,
  onCancel,
  defaultAction = 'paste',
  onCopy,
  onPaste,
}: VariableFillModalProps) {
  const variableFill = useVariableFill({
    defaultAction,
    onCancel,
    onCopy,
    onPaste,
    prompt,
    variables,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-3 py-3 animate-[fadeIn_150ms_ease-out] sm:pt-[10vh]"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={variableFill.handleBackdropClick}
      data-testid="variable-fill-backdrop"
    >
      <dialog
        open
        role="dialog"
        aria-modal="true"
        aria-label={`Fill variables for ${prompt.title}`}
        className="relative m-0 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border shadow-2xl animate-[slideDown_150ms_ease-out]"
        style={{
          backgroundColor: 'var(--color-panel)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
        }}
      >
        <VariableFillHeader title={prompt.title} onCancel={onCancel} />

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <VariableInputList
            firstInputRef={variableFill.firstInputRef}
            onValueChange={variableFill.handleValueChange}
            values={variableFill.values}
            variables={variables}
          />
          <VariablePreview
            isComplete={variableFill.isComplete}
            renderedText={variableFill.renderedText}
          />
        </div>

        <VariableFillActions
          copied={variableFill.copied}
          isComplete={variableFill.isComplete}
          isPasteAction={variableFill.isPasteAction}
          onCancel={onCancel}
          onPrimaryAction={variableFill.handlePrimaryAction}
        />
      </dialog>
    </div>
  );
}
