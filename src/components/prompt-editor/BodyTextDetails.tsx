import { useEffect, useId, useState } from 'react';
import { Button } from '../ui/Button';
import { fingerprintText, type TextFingerprint } from '../../utils/text-fingerprint';

type Calculation = { body: string } & ({ fingerprint: TextFingerprint } | { error: true });

/** Shows a local fingerprint of the complete current draft, including text restored from storage. */
export function BodyTextDetails({ body }: { body: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [calculation, setCalculation] = useState<Calculation>();
  const panelId = useId();
  const current = calculation?.body === body ? calculation : undefined;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    // Ignore superseded calculations; a fingerprint must never describe an older draft.
    void fingerprintText(body).then(
      (fingerprint) => { if (!cancelled) setCalculation({ body, fingerprint }); },
      () => { if (!cancelled) setCalculation({ body, error: true }); },
    );
    return () => { cancelled = true; };
  }, [body, isOpen]);

  return (
    <div className="mb-3 min-w-0 max-w-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
      >
        Text details
      </Button>
      {isOpen && (
        <div id={panelId} className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-3 text-xs text-[var(--color-text-main)]">
          <p className="mb-2 text-[var(--color-text-muted)]">
            Calculated locally from the complete current text, including whitespace and line endings.
          </p>
          {!current ? (
            <p role="status">Calculating text fingerprint…</p>
          ) : 'error' in current ? (
            <p role="alert">Text fingerprint is unavailable in this browser. No comparison has been made.</p>
          ) : (
            <dl className="space-y-2">
              <div>
                <dt>UTF-8 bytes</dt>
                <dd><output aria-label="UTF-8 bytes">{current.fingerprint.utf8Bytes}</output></dd>
              </div>
              <div>
                <dt>SHA-256</dt>
                <dd className="break-all font-mono select-text"><output aria-label="Text SHA-256">{current.fingerprint.sha256}</output></dd>
              </div>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
