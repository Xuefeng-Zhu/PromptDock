import type { ReactNode } from 'react';

interface FilterSectionProps {
  title: string;
  children: ReactNode;
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-main)]">{title}</h3>
      {children}
    </section>
  );
}
