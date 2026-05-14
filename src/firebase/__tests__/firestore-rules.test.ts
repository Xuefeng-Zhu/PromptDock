import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const describeRules = emulatorHost ? describe : describe.skip;

const projectId = `promptdock-rules-${Date.now()}`;
const workspaceId = 'workspace-1';
const domainInviteId = `${workspaceId}_example.com`;

function domainInvitePayload(overrides: Record<string, unknown> = {}) {
  return {
    workspaceId,
    workspaceName: 'Design Team',
    ownerId: 'owner-1',
    domain: 'example.com',
    role: 'viewer',
    status: 'active',
    invitedBy: 'owner-1',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    revokedAt: null,
    revokedBy: null,
    ...overrides,
  };
}

function viewerMemberPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-2',
    workspaceId,
    userId: 'user-2',
    role: 'viewer',
    email: 'person@example.com',
    displayName: 'Person Example',
    joinedAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    acceptedDomainInviteId: domainInviteId,
    ...overrides,
  };
}

async function seedWorkspace(testEnv: RulesTestEnvironment) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'workspaces', workspaceId), {
      name: 'Design Team',
      ownerId: 'owner-1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    await setDoc(doc(db, 'workspaces', workspaceId, 'members', 'owner-1'), {
      id: 'owner-1',
      workspaceId,
      userId: 'owner-1',
      role: 'owner',
      email: 'owner@example.com',
      displayName: 'Owner One',
      joinedAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
  });
}

async function seedDomainInvite(testEnv: RulesTestEnvironment) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), 'workspaceDomainInvites', domainInviteId),
      domainInvitePayload(),
    );
  });
}

describeRules('firestore domain workspace invite rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8'),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await seedWorkspace(testEnv);
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('allows owners to create active viewer domain invites', async () => {
    const db = testEnv.authenticatedContext('owner-1', {
      email: 'owner@example.com',
    }).firestore();

    await assertSucceeds(setDoc(
      doc(db, 'workspaceDomainInvites', domainInviteId),
      domainInvitePayload(),
    ));
  });

  it('denies non-owners creating domain invites', async () => {
    const db = testEnv.authenticatedContext('user-2', {
      email: 'person@example.com',
    }).firestore();

    await assertFails(setDoc(
      doc(db, 'workspaceDomainInvites', domainInviteId),
      domainInvitePayload({ invitedBy: 'user-2' }),
    ));
  });

  it('allows exact-domain users to query active viewer domain invites', async () => {
    await seedDomainInvite(testEnv);
    const db = testEnv.authenticatedContext('user-2', {
      email: 'person@example.com',
    }).firestore();

    await assertSucceeds(getDocs(query(
      collection(db, 'workspaceDomainInvites'),
      where('domain', '==', 'example.com'),
      where('status', '==', 'active'),
      where('role', '==', 'viewer'),
    )));
  });

  it('denies subdomain users reading parent-domain invites', async () => {
    await seedDomainInvite(testEnv);
    const db = testEnv.authenticatedContext('user-2', {
      email: 'person@team.example.com',
    }).firestore();

    await assertFails(getDocs(query(
      collection(db, 'workspaceDomainInvites'),
      where('domain', '==', 'example.com'),
      where('status', '==', 'active'),
      where('role', '==', 'viewer'),
    )));
  });

  it('allows matching-domain users to self-create viewer membership records', async () => {
    await seedDomainInvite(testEnv);
    const db = testEnv.authenticatedContext('user-2', {
      email: 'person@example.com',
    }).firestore();

    await assertSucceeds(setDoc(
      doc(db, 'workspaces', workspaceId, 'members', 'user-2'),
      viewerMemberPayload(),
    ));
    await assertSucceeds(setDoc(
      doc(db, 'workspaceMemberships', `${workspaceId}_user-2`),
      {
        ...viewerMemberPayload(),
        workspaceName: 'Design Team',
        ownerId: 'owner-1',
      },
    ));
  });

  it('denies role escalation during domain invite acceptance', async () => {
    await seedDomainInvite(testEnv);
    const db = testEnv.authenticatedContext('user-2', {
      email: 'person@example.com',
    }).firestore();

    await assertFails(setDoc(
      doc(db, 'workspaces', workspaceId, 'members', 'user-2'),
      viewerMemberPayload({ role: 'editor' }),
    ));
  });

  it('allows owners to revoke domain invites without deleting them', async () => {
    await seedDomainInvite(testEnv);
    const db = testEnv.authenticatedContext('owner-1', {
      email: 'owner@example.com',
    }).firestore();

    await assertSucceeds(updateDoc(
      doc(db, 'workspaceDomainInvites', domainInviteId),
      {
        status: 'revoked',
        revokedAt: new Date('2024-01-02T00:00:00.000Z'),
        revokedBy: 'owner-1',
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      },
    ));
  });

  it('is skipped unless FIRESTORE_EMULATOR_HOST is configured', () => {
    expect(emulatorHost).toBeTruthy();
  });
});
