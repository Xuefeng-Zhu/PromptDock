import { useLayoutEffect, useRef } from 'react';
import { Code, Copy, Info, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { splitPromptTemplateParts } from '../../utils/prompt-template';

const BODY_EDITOR_MIN_ROWS = 12;
const BODY_EDITOR_LINE_HEIGHT_REM = 1.625;
const BODY_EDITOR_VERTICAL_PADDING_REM = 1.5;

interface BodyTemplateEditorProps {
  body: string;
  charCount: number;
  isExpanded: boolean;
  showFormattingHelp: boolean;
  wordCount: number;
  onBodyChange: (body: string) => void;
  onCopyPrompt?: () => void;
  onInsertVariable: () => void;
  onToggleExpanded: () => void;
  onToggleFormattingHelp: () => void;
}

function HighlightedBody({ text }: { text: string }) {
  const parts = splitPromptTemplateParts(text);
  return (
    <div className="whitespace-pre-wrap break-words font-[var(--font-mono)] text-sm leading-[1.625rem] text-[var(--color-text-main)] [overflow-wrap:anywhere]">
      {parts.map((part, index) =>
        part.isVariable ? (
          <span
            key={index}
            className="rounded px-0.5 text-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium"
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </div>
  );
}

export function BodyTemplateEditor({
  body,
  charCount,
  isExpanded,
  showFormattingHelp,
  wordCount,
  onBodyChange,
  onCopyPrompt,
  onInsertVariable,
  onToggleExpanded,
  onToggleFormattingHelp,
}: BodyTemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorMinHeight = `${BODY_EDITOR_MIN_ROWS * BODY_EDITOR_LINE_HEIGHT_REM + BODY_EDITOR_VERTICAL_PADDING_REM}rem`;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = editorMinHeight;
    const nextHeight = Math.max(textarea.scrollHeight, textarea.clientHeight);
    textarea.style.height = `${nextHeight}px`;
  }, [body, editorMinHeight, isExpanded]);

  return (
    <div className="mb-2">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="prompt-body-editor"
            className="text-sm font-medium text-[var(--color-text-main)]"
          >
            Body
          </label>
          <span className="text-xs text-[var(--color-text-muted)]">
            Use {'{{variable}}'} to insert variables
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onInsertVariable}>
            <Code className="mr-1.5 h-3.5 w-3.5" />
            Insert variable
          </Button>
          {onCopyPrompt && (
            <Button variant="secondary" size="sm" onClick={onCopyPrompt}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy prompt
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20">
        <div className="relative min-w-0" style={{ minHeight: editorMinHeight }}>
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden px-4 py-3"
            style={{ minHeight: editorMinHeight }}
          >
            <HighlightedBody text={body} />
          </div>
          <textarea
            ref={textareaRef}
            id="prompt-body-editor"
            value={body}
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder="Write your prompt template here. Use {{variable_name}} for variables."
            rows={BODY_EDITOR_MIN_ROWS}
            className="relative w-full resize-none overflow-hidden border-none bg-transparent px-4 py-3 font-[var(--font-mono)] text-sm leading-[1.625rem] text-transparent caret-[var(--color-text-main)] break-words placeholder:text-[var(--color-text-placeholder)] outline-none [overflow-wrap:anywhere]"
            style={{ caretColor: 'var(--color-text-main)', minHeight: editorMinHeight }}
            aria-label="Body"
            aria-describedby="body-footer"
          />
        </div>

        <div
          id="body-footer"
          className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-muted)]"
        >
          <button
            type="button"
            onClick={onToggleFormattingHelp}
            className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
            aria-expanded={showFormattingHelp}
            aria-controls="formatting-help"
          >
            <Info className="h-3.5 w-3.5" />
            Formatting help
          </button>
          <div className="flex items-center gap-3">
            <span>{wordCount} words · {charCount} characters</span>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="hover:text-[var(--color-primary)] transition-colors"
              aria-label={isExpanded ? 'Restore preview' : 'Expand editor'}
              aria-pressed={isExpanded}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {showFormattingHelp && (
        <div
          id="formatting-help"
          className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-xs text-[var(--color-text-muted)]"
        >
          <p className="font-medium text-[var(--color-text-main)]">Template formatting</p>
          <p className="mt-1">Use double braces for variables, such as {'{{topic}}'} or {'{{audience}}'}.</p>
          <p className="mt-1">Line breaks and spacing are preserved in the final prompt.</p>
        </div>
      )}
    </div>
  );
}
