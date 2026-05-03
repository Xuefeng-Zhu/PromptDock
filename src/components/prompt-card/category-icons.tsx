import {
  ClipboardList,
  Code,
  FileText,
  Lightbulb,
  Mail,
  Pencil,
} from 'lucide-react';
import type { ReactNode } from 'react';

const CATEGORY_ICON_MAP: Record<string, ReactNode> = {
  FileText: <FileText className="h-4 w-4" />,
  Pencil: <Pencil className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Mail: <Mail className="h-4 w-4" />,
  ClipboardList: <ClipboardList className="h-4 w-4" />,
};

function getCategoryIcon(iconName: string): ReactNode {
  return CATEGORY_ICON_MAP[iconName] ?? <FileText className="h-4 w-4" />;
}

export function resolveIconFromColor(categoryColor: string): ReactNode {
  if (categoryColor.includes('purple')) return getCategoryIcon('FileText');
  if (categoryColor.includes('green')) return getCategoryIcon('Pencil');
  if (categoryColor.includes('amber')) return getCategoryIcon('Lightbulb');
  if (categoryColor.includes('blue')) return getCategoryIcon('Code');
  if (categoryColor.includes('rose')) return getCategoryIcon('Mail');
  if (categoryColor.includes('teal')) return getCategoryIcon('ClipboardList');
  return getCategoryIcon('FileText');
}
