import type { PromptRecipe, Folder } from '../types/index';

// Category color mapping for IconTile backgrounds
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  'summarize-text': { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'FileText' },
  'rewrite':        { bg: 'bg-green-100',  text: 'text-green-600',  icon: 'Pencil' },
  'ideas':          { bg: 'bg-amber-100',  text: 'text-amber-600',  icon: 'Lightbulb' },
  'code-review':    { bg: 'bg-blue-100',   text: 'text-blue-600',   icon: 'Code' },
  'email-draft':    { bg: 'bg-rose-100',   text: 'text-rose-600',   icon: 'Mail' },
  'meeting-notes':  { bg: 'bg-teal-100',   text: 'text-teal-600',   icon: 'ClipboardList' },
};

export const MOCK_FOLDERS: Folder[] = [
  { id: 'folder-writing',     name: 'Writing',     createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-10-01') },
  { id: 'folder-product',     name: 'Product',     createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-10-01') },
  { id: 'folder-engineering', name: 'Engineering', createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-10-01') },
  { id: 'folder-work',        name: 'Work',        createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-10-01') },
];

export const MOCK_PROMPTS: PromptRecipe[] = [
  {
    id: 'prompt-summarize',
    workspaceId: 'local',
    title: 'Summarize Text',
    description: 'Condense long text into a concise summary at a chosen detail level.',
    body: `Summarize the following text for a {{audience}} audience. Be clear, accurate, and concise.

Text:
{{text}}

Output format: {{format}}`,
    tags: ['summarization', 'writing'],
    folderId: 'folder-writing',
    favorite: true,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-01'),
    lastUsedAt: new Date('2024-12-20'),
    createdBy: 'local',
    version: 1,
  },
  {
    id: 'prompt-rewrite',
    workspaceId: 'local',
    title: 'Rewrite in Clear English',
    description: 'Rewrite awkward or complex text into plain, readable English.',
    body: `Rewrite the following text in a {{tone}} tone. Keep the original meaning but make it clearer and easier to read.

Text:
{{text}}`,
    tags: ['writing', 'editing'],
    folderId: 'folder-writing',
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-11-18'),
    updatedAt: new Date('2024-11-25'),
    lastUsedAt: new Date('2024-12-15'),
    createdBy: 'local',
    version: 1,
  },
  {
    id: 'prompt-ideas',
    workspaceId: 'local',
    title: 'Generate Product Ideas',
    description: 'Brainstorm creative product ideas for a given problem space and audience.',
    body: `Generate 5 creative product ideas that solve the following problem:

Problem: {{problem}}

Target audience: {{audience}}

For each idea, include a one-line description, the core value proposition, and one potential risk.`,
    tags: ['ideation', 'product'],
    folderId: 'folder-product',
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2024-12-05'),
    lastUsedAt: new Date('2024-12-10'),
    createdBy: 'local',
    version: 1,
  },
  {
    id: 'prompt-code-review',
    workspaceId: 'local',
    title: 'Code Review Assistant',
    description: 'Get a thorough code review with actionable feedback and suggestions.',
    body: `Review the following {{language}} code. Focus on correctness, readability, performance, and security. Provide specific suggestions for improvement.

\`\`\`{{language}}
{{code}}
\`\`\``,
    tags: ['code', 'review'],
    folderId: 'folder-engineering',
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-11-22'),
    updatedAt: new Date('2024-12-08'),
    lastUsedAt: new Date('2024-12-18'),
    createdBy: 'local',
    version: 1,
  },
  {
    id: 'prompt-email-draft',
    workspaceId: 'local',
    title: 'Email Draft',
    description: 'Draft a professional email from key talking points.',
    body: `Draft a professional email to {{recipient}} in a {{tone}} tone. Cover the following points:

{{points}}

Keep it concise and end with a clear call to action.`,
    tags: ['email', 'writing'],
    folderId: 'folder-work',
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-11-25'),
    updatedAt: new Date('2024-12-10'),
    lastUsedAt: new Date('2024-12-19'),
    createdBy: 'local',
    version: 1,
  },
  {
    id: 'prompt-meeting-notes',
    workspaceId: 'local',
    title: 'Meeting Notes Extractor',
    description: 'Extract structured meeting notes from a raw transcript.',
    body: `Extract structured meeting notes from the following transcript. Include attendees, key decisions, action items with owners, and open questions.

Transcript:
{{transcript}}

Output format: {{format}}`,
    tags: ['notes', 'meeting'],
    folderId: 'folder-work',
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-11-28'),
    updatedAt: new Date('2024-12-12'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 1,
  },
];

// Prompt-to-category mapping for color lookup
export const PROMPT_CATEGORY_MAP: Record<string, string> = {
  'prompt-summarize':     'summarize-text',
  'prompt-rewrite':       'rewrite',
  'prompt-ideas':         'ideas',
  'prompt-code-review':   'code-review',
  'prompt-email-draft':   'email-draft',
  'prompt-meeting-notes': 'meeting-notes',
};
