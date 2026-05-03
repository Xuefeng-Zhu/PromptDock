import type { Folder, PromptRecipe } from '../../types/index';
import { formatDate, formatRelativeShort } from '../../utils/date-format';

interface PromptMetadataSectionProps {
  folder?: Folder;
  prompt: PromptRecipe;
}

export function PromptMetadataSection({ folder, prompt }: PromptMetadataSectionProps) {
  return (
    <div className="px-5 pb-4 space-y-2.5">
      <MetadataRow label="Last used" value={formatRelativeShort(prompt.lastUsedAt)} />
      <MetadataRow label="Created" value={formatDate(prompt.createdAt)} />
      <MetadataRow label="Updated" value={formatDate(prompt.updatedAt)} />
      {folder && <MetadataRow label="Folder" value={folder.name} />}
    </div>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[var(--color-text-main)]">{value}</span>
    </div>
  );
}
