import { describe, expect, it } from 'vitest';
import { getQuickFolderOptions, type FolderOption } from '../folder-options';

const folderChoices: FolderOption[] = [
  { label: 'Writing', value: 'folder-writing' },
  { label: 'Client Work', value: 'folder-client-work' },
  { label: 'Engineering', value: 'folder-engineering' },
];

describe('getQuickFolderOptions', () => {
  it('includes No folder for empty input', () => {
    expect(getQuickFolderOptions({
      canCreateFolder: true,
      folderChoices,
      input: '',
    })).toEqual([
      { id: 'none', kind: 'none', label: 'No folder' },
      { id: 'folder-writing', kind: 'folder', label: 'Writing', value: 'folder-writing' },
      {
        id: 'folder-client-work',
        kind: 'folder',
        label: 'Client Work',
        value: 'folder-client-work',
      },
      {
        id: 'folder-engineering',
        kind: 'folder',
        label: 'Engineering',
        value: 'folder-engineering',
      },
    ]);
  });

  it('matches folders by normalized partial input', () => {
    expect(getQuickFolderOptions({
      canCreateFolder: true,
      folderChoices,
      input: 'client',
    })).toEqual([
      {
        id: 'folder-client-work',
        kind: 'folder',
        label: 'Client Work',
        value: 'folder-client-work',
      },
      { id: 'create-client', kind: 'create', label: 'Create "client"', value: 'client' },
    ]);
  });

  it('does not offer creation for duplicate normalized names', () => {
    expect(getQuickFolderOptions({
      canCreateFolder: true,
      folderChoices,
      input: '  client    work ',
    })).toEqual([
      {
        id: 'folder-client-work',
        kind: 'folder',
        label: 'Client Work',
        value: 'folder-client-work',
      },
    ]);
  });

  it('omits create options when creation is unavailable', () => {
    expect(getQuickFolderOptions({
      canCreateFolder: false,
      folderChoices,
      input: 'Roadmap',
    })).toEqual([]);
  });

  it('limits the returned options', () => {
    expect(getQuickFolderOptions({
      canCreateFolder: true,
      folderChoices,
      input: '',
      limit: 2,
    })).toHaveLength(2);
  });
});
