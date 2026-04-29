import { useState, useMemo } from 'react';
import { VariableParser } from '../services/variable-parser';
import { PromptRenderer } from '../services/prompt-renderer';
import type { PromptRecipe } from '../types';

const parser = new VariableParser();
const renderer = new PromptRenderer();

interface Props {
  prompt: PromptRecipe;
  onCopy: (text: string) => void;
  onPaste: (text: string) => void;
  onClose: () => void;
}

export function VariableFillModal({ prompt, onCopy, onPaste, onClose }: Props) {
  const variables = useMemo(() => parser.parse(prompt.body), [prompt.body]);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map((v) => [v, '']))
  );

  const result = renderer.render(prompt.body, values);
  const renderedText = result.success ? result.text : '';
  const allFilled = result.success;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold">{prompt.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {variables.map((v) => (
            <div key={v}>
              <label htmlFor={`var-${v}`} className="block text-sm font-medium mb-1">{v}</label>
              <input
                id={`var-${v}`}
                value={values[v]}
                onChange={(e) => setValues({ ...values, [v]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder={`Enter ${v}...`}
              />
            </div>
          ))}
          {allFilled && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-1">Preview</p>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm whitespace-pre-wrap">{renderedText}</div>
            </div>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onCopy(renderedText)}
            disabled={!allFilled}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Copy
          </button>
          <button
            onClick={() => onPaste(renderedText)}
            disabled={!allFilled}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Paste into App
          </button>
          <button
            onClick={() => { onCopy(renderedText); onClose(); }}
            disabled={!allFilled}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Copy & Close
          </button>
        </div>
      </div>
    </div>
  );
}
