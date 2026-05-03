// ─── Props ─────────────────────────────────────────────────────────────────────

export interface IconTileProps {
  icon: React.ReactNode;
  color: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Small colored square with a pastel background and centered lucide-react icon.
 * Used in PromptCard and search results to represent a prompt's category.
 *
 * The `color` prop accepts a Tailwind background class (e.g. "bg-purple-100")
 * or a CSS custom property reference.
 */
export function IconTile({ icon, color }: IconTileProps) {
  return (
    <div
      className={[
        'inline-flex items-center justify-center rounded-lg h-9 w-9 shrink-0',
        color,
      ].join(' ')}
    >
      {icon}
    </div>
  );
}
