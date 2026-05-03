import { splitPromptTemplateParts } from '../../utils/prompt-template';

export function PromptHighlightedBody({ text }: { text: string }) {
  const parts = splitPromptTemplateParts(text);

  return (
    <pre className="whitespace-pre-wrap font-[var(--font-mono)] text-xs leading-relaxed text-[var(--color-text-main)]">
      {parts.map((part, index) =>
        part.isVariable ? (
          <span
            key={index}
            className="text-[var(--color-primary)] font-medium"
          >
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </pre>
  );
}
