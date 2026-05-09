// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncService } from '../sync-service';
import type { AppModeStore } from '../../stores/app-mode-store';
import type { Folder, PromptRecipe } from '../../types/index';

const firestoreMocks = vi.hoisted(() => {
  const state = {
    remoteFolderDocs: [] as Array<{ id: string; data: Record<string, unknown> }>,
  };

  return {
    state,
    collection: vi.fn((_firestore: unknown, ...path: string[]) => ({ path })),
    doc: vi.fn((_firestore: unknown, ...path: string[]) => ({ id: path[path.length - 1], path })),
    getDoc: vi.fn(async (ref: { id: string }) => ({
      exists: () => state.remoteFolderDocs.some((doc) => doc.id === ref.id),
    })),
    getDocs: vi.fn(async (ref: { path: string[] }) => ({
      docs: ref.path[ref.path.length - 1] === 'folders'
        ? state.remoteFolderDocs.map((doc) => ({
            id: doc.id,
            data: () => doc.data,
          }))
        : [],
    })),
    onSnapshot: vi.fn((_target: unknown, onNext: (snapshot: { docs: never[] }) => void) => {
      onNext({ docs: [] });
      return vi.fn();
    }),
    query: vi.fn((collectionRef: unknown) => collectionRef),
    setDoc: vi.fn(async () => {}),
    Timestamp: {
      fromDate: vi.fn((date: Date) => ({ date })),
    },
    where: vi.fn(() => ({})),
  };
});

vi.mock('../../firebase/config', () => ({
  getFirebaseFirestore: vi.fn(async () => ({})),
}));

vi.mock('firebase/firestore', () => ({
  collection: firestoreMocks.collection,
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
  onSnapshot: firestoreMocks.onSnapshot,
  query: firestoreMocks.query,
  setDoc: firestoreMocks.setDoc,
  Timestamp: firestoreMocks.Timestamp,
  where: firestoreMocks.where,
}));

vi.mock('../../repositories/firestore-backend', () => ({
  FirestoreBackend: class FirestoreBackend {},
  firestoreDocToFolder: vi.fn(),
  firestoreDocToPromptRecipe: vi.fn(),
}));

function createMockAppModeStore(): AppModeStore {
  return {
    mode: 'local',
    userId: null,
    isOnline: true,
    syncStatus: 'local',
    lastSyncedAt: null,
    setMode: vi.fn(function (this: AppModeStore, mode) {
      this.mode = mode;
    }),
    setOnline: vi.fn(function (this: AppModeStore, online) {
      this.isOnline = online;
    }),
    setSyncStatus: vi.fn(function (this: AppModeStore, status) {
      this.syncStatus = status;
    }),
    setUserId: vi.fn(function (this: AppModeStore, userId) {
      this.userId = userId;
    }),
  };
}

function makeFolder(overrides: Partial<Folder> = {}): Folder {
  return {
    id: 'folder-client-local',
    name: 'Client Work',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptRecipe> = {}): PromptRecipe {
  return {
    id: 'prompt-with-variables',
    workspaceId: 'local',
    title: 'Prompt with variables',
    description: 'Uses variable metadata',
    body: 'Write a {{tone}} reply to {{recipient}}.',
    variables: [
      {
        name: 'tone',
        defaultValue: 'friendly',
        description: 'Voice to use',
        inputType: 'dropdown',
        options: ['friendly', 'formal'],
      },
      {
        name: 'recipient',
        defaultValue: '',
        description: 'Who receives the message',
        inputType: 'text',
        options: [],
      },
    ],
    tags: ['email'],
    folderId: null,
    favorite: false,
    archived: false,
    archivedAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-02T00:00:00.000Z'),
    lastUsedAt: null,
    createdBy: 'local',
    version: 3,
    ...overrides,
  };
}

describe('SyncService folder migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.state.remoteFolderDocs = [];
  });

  it('skips local folders whose normalized name already exists remotely', async () => {
    firestoreMocks.state.remoteFolderDocs = [
      {
        id: 'folder-client-remote',
        data: {
          name: 'Client Work',
          normalizedName: 'client work',
        },
      },
    ];
    const service = new SyncService({ appModeStore: createMockAppModeStore() });

    await service.transitionToSynced(
      'user-1',
      'workspace-1',
      [],
      'migrate',
      [
        makeFolder({ id: 'folder-client-local', name: ' client   work ' }),
        makeFolder({ id: 'folder-design-local', name: 'Design' }),
      ],
    );

    expect(firestoreMocks.setDoc).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'folder-design-local' }),
      expect.objectContaining({
        name: 'Design',
        normalizedName: 'design',
      }),
    );
  });

  it('preserves prompt variable metadata when migrating local prompts', async () => {
    const service = new SyncService({ appModeStore: createMockAppModeStore() });
    const prompt = makePrompt();

    await service.transitionToSynced(
      'user-1',
      'workspace-1',
      [prompt],
      'migrate',
    );

    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: prompt.id }),
      expect.objectContaining({
        body: prompt.body,
        variables: prompt.variables,
      }),
    );
  });
});
