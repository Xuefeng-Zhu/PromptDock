import { useState } from 'react';
import { useLayoutMetrics } from '../../hooks/use-layout-metrics';
import { Button } from '../ui/Button';

export function LayoutDetails() {
  const [open, setOpen] = useState(false);
  const { metrics, refresh } = useLayoutMetrics(open);

  return (
    <details
      className="mt-3 min-w-0 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer font-medium text-[var(--color-text-main)]">
        Layout details
      </summary>
      {open && (
        <div className="mt-3 min-w-0 space-y-3">
          <p>Current page measurements in CSS pixels.</p>
          {metrics && (
            <dl className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-2">
              <dt>Browser inner width</dt>
              <dd><output aria-label="Browser inner width">{metrics.innerWidth}</output></dd>
              <dt>Browser inner height</dt>
              <dd><output aria-label="Browser inner height">{metrics.innerHeight}</output></dd>
              <dt>Document client width</dt>
              <dd><output aria-label="Document client width">{metrics.clientWidth}</output></dd>
              <dt>Document scroll width</dt>
              <dd><output aria-label="Document scroll width">{metrics.scrollWidth}</output></dd>
              <dt>Horizontal overflow</dt>
              <dd><output aria-label="Horizontal overflow">{metrics.horizontalOverflow}</output></dd>
            </dl>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={refresh}>
            Refresh measurements
          </Button>
        </div>
      )}
    </details>
  );
}
