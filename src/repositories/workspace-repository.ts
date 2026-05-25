import type {
  AuthUser,
  Workspace,
  WorkspaceDomainInvite,
  WorkspaceInvite,
  WorkspaceInviteRole,
  WorkspaceMember,
  WorkspaceMembership,
  WorkspaceRole,
} from '../types/index';
import type { IStorageBackend, IWorkspaceRepository } from './interfaces';
import {
  assertValidWorkspaceDomain,
  getWorkspaceDomainFromEmail,
  workspaceDomainInviteId,
} from '../utils/workspace-domain';
import {
  createPersonalWorkspaceRecord,
  createWorkspaceMemberPayload,
  createWorkspaceMembershipPayload,
  normalizeWorkspaceEmail,
  workspaceMembershipId,
} from '../utils/workspace-records';
import {
  type FirestoreWorkspaceDoc,
  type FirestoreWorkspaceDomainInviteDoc,
  type FirestoreWorkspaceInviteDoc,
  type FirestoreWorkspaceMemberDoc,
  type FirestoreWorkspaceMembershipDoc,
  toWorkspace,
  toWorkspaceDomainInvite,
  toWorkspaceInvite,
  toWorkspaceMember,
  toWorkspaceMembership,
} from './workspace-firestore-converters';

const LOCAL_WORKSPACE_ID = 'local';

function createPersonalWorkspaceFallback(userId: string): Workspace {
  return createPersonalWorkspaceRecord(userId);
}

function createPersonalMembershipFallback(userId: string): WorkspaceMembership {
  const workspace = createPersonalWorkspaceFallback(userId);
  return {
    id: workspaceMembershipId(userId, userId),
    workspaceId: userId,
    userId,
    role: 'owner',
    email: '',
    displayName: null,
    workspaceName: workspace.name,
    ownerId: userId,
    joinedAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

/**
 * Repository for local and synced workspace metadata.
 *
 * Local mode still exposes one persisted workspace. Synced methods are lazy and
 * talk to Firestore only after auth/sync code calls them.
 */
export class WorkspaceRepository implements IWorkspaceRepository {
  private workspace: Workspace | null = null;
  private loaded = false;

  constructor(private readonly backend: IStorageBackend) {}

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.workspace = await this.backend.readWorkspace();
      this.loaded = true;
    }
  }

  private async persist(): Promise<void> {
    if (this.workspace) {
      await this.backend.writeWorkspace(this.workspace);
    }
  }

  async create(
    workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Workspace> {
    await this.ensureLoaded();

    const now = new Date();
    const newWorkspace: Workspace = {
      ...workspace,
      id: LOCAL_WORKSPACE_ID,
      createdAt: now,
      updatedAt: now,
    };

    this.workspace = newWorkspace;
    await this.persist();
    return newWorkspace;
  }

  async getById(id: string): Promise<Workspace | null> {
    await this.ensureLoaded();

    if (!this.workspace || this.workspace.id !== id) {
      return null;
    }

    return this.workspace;
  }

  async listForUser(_userId: string): Promise<Workspace[]> {
    await this.ensureLoaded();
    return this.workspace ? [this.workspace] : [];
  }

  async update(id: string, changes: Partial<Workspace>): Promise<Workspace> {
    await this.ensureLoaded();

    if (!this.workspace || this.workspace.id !== id) {
      throw new Error(`Workspace not found: ${id}`);
    }

    const updated: Workspace = {
      ...this.workspace,
      ...changes,
      id: this.workspace.id,
      updatedAt: new Date(),
    };

    this.workspace = updated;
    await this.persist();
    return updated;
  }

  async updateSyncedWorkspace(id: string, changes: Partial<Workspace>): Promise<Workspace> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, getDoc, serverTimestamp, updateDoc } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const workspaceRef = doc(firestore, 'workspaces', id);
    const updateData: Record<string, unknown> = {
      ...changes,
      updatedAt: serverTimestamp(),
    };
    delete updateData.id;
    delete updateData.createdAt;
    await updateDoc(workspaceRef, updateData);

    const snapshot = await getDoc(workspaceRef);
    if (!snapshot.exists()) throw new Error(`Workspace not found: ${id}`);
    return toWorkspace(snapshot.id, snapshot.data() as FirestoreWorkspaceDoc);
  }

  async bootstrapPersonalWorkspace(user: AuthUser): Promise<Workspace> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, getDoc, serverTimestamp, setDoc } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const timestamp = serverTimestamp();
    const workspaceRef = doc(firestore, 'workspaces', user.uid);
    const workspace = createPersonalWorkspaceRecord(user.uid);
    const memberPayload = createWorkspaceMemberPayload(workspace, user, 'owner', timestamp);
    const membershipPayload = createWorkspaceMembershipPayload(workspace, user, 'owner', timestamp);

    const memberRef = doc(firestore, 'workspaces', user.uid, 'members', user.uid);
    const membershipRef = doc(
      firestore,
      'workspaceMemberships',
      workspaceMembershipId(user.uid, user.uid),
    );
    const workspacePayload: Record<string, unknown> = {
      name: workspace.name,
      ownerId: workspace.ownerId,
      updatedAt: timestamp,
    };

    await setDoc(
      workspaceRef,
      workspacePayload,
      { merge: true },
    );

    await setDoc(memberRef, memberPayload, { merge: true });
    await setDoc(membershipRef, membershipPayload, { merge: true });

    const workspaceSnapshot = await getDoc(workspaceRef);
    if (!workspaceSnapshot.exists()) {
      await setDoc(workspaceRef, { createdAt: timestamp }, { merge: true });
      return workspace;
    }

    const workspaceData = workspaceSnapshot.data() as FirestoreWorkspaceDoc;
    const syncedWorkspace = toWorkspace(workspaceSnapshot.id, workspaceData);
    if (!workspaceData.createdAt) {
      await setDoc(workspaceRef, { createdAt: timestamp }, { merge: true });
    }

    return syncedWorkspace;
  }

  async listMembershipsForUser(userId: string): Promise<WorkspaceMembership[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const membershipsCol = collection(firestore, 'workspaceMemberships');
    const q = query(membershipsCol, where('userId', '==', userId));
    const snapshot = await getDocs(q).catch(() => null);
    if (!snapshot) return [createPersonalMembershipFallback(userId)];

    const memberships = snapshot.docs.map((docSnap) =>
      toWorkspaceMembership(docSnap.id, docSnap.data() as FirestoreWorkspaceMembershipDoc),
    );

    return memberships.length > 0 ? memberships : [createPersonalMembershipFallback(userId)];
  }

  async listPendingDomainInvitesForEmail(email: string): Promise<WorkspaceDomainInvite[]> {
    const domain = getWorkspaceDomainFromEmail(email);
    if (!domain) return [];

    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const invitesCol = collection(firestore, 'workspaceDomainInvites');
    const q = query(
      invitesCol,
      where('domain', '==', domain),
      where('status', '==', 'active'),
      where('role', '==', 'viewer'),
    );
    const snapshot = await getDocs(q).catch(() => null);
    if (!snapshot) return [];

    return snapshot.docs
      .map((docSnap) =>
        toWorkspaceDomainInvite(
          docSnap.id,
          docSnap.data() as FirestoreWorkspaceDomainInviteDoc,
        ),
      )
      .filter((invite) => invite.status === 'active' && invite.role === 'viewer');
  }

  async listSyncedWorkspacesForUser(userId: string): Promise<Workspace[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, getDoc } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const memberships = await this.listMembershipsForUser(userId);
    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspaceRef = doc(firestore, 'workspaces', membership.workspaceId);
        const snapshot = await getDoc(workspaceRef).catch(() => null);
        if (!snapshot) return null;
        if (!snapshot.exists()) return null;
        return toWorkspace(snapshot.id, snapshot.data() as FirestoreWorkspaceDoc);
      }),
    );

    const availableWorkspaces = workspaces.filter((workspace): workspace is Workspace => workspace !== null);
    return availableWorkspaces.length > 0
      ? availableWorkspaces
      : [createPersonalWorkspaceFallback(userId)];
  }

  async listPendingInvitesForEmail(email: string): Promise<WorkspaceInvite[]> {
    const normalizedEmail = normalizeWorkspaceEmail(email);
    if (!normalizedEmail) return [];

    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const invitesCol = collection(firestore, 'workspaceInvites');
    const q = query(invitesCol, where('email', '==', normalizedEmail));
    const snapshot = await getDocs(q).catch(() => null);
    if (!snapshot) return [];

    return snapshot.docs
      .map((docSnap) => toWorkspaceInvite(docSnap.id, docSnap.data() as FirestoreWorkspaceInviteDoc))
      .filter((invite) => invite.status === 'pending');
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const membersCol = collection(firestore, 'workspaces', workspaceId, 'members');
    const snapshot = await getDocs(membersCol).catch(() => null);
    if (!snapshot) return [];

    return snapshot.docs.map((docSnap) =>
      toWorkspaceMember(docSnap.id, docSnap.data() as FirestoreWorkspaceMemberDoc),
    );
  }

  async listInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const invitesCol = collection(firestore, 'workspaceInvites');
    const q = query(invitesCol, where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q).catch(() => null);
    if (!snapshot) return [];

    return snapshot.docs
      .map((docSnap) => toWorkspaceInvite(docSnap.id, docSnap.data() as FirestoreWorkspaceInviteDoc))
      .filter((invite) => invite.status === 'pending');
  }

  async listDomainInvites(workspaceId: string): Promise<WorkspaceDomainInvite[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const invitesCol = collection(firestore, 'workspaceDomainInvites');
    const q = query(
      invitesCol,
      where('workspaceId', '==', workspaceId),
      where('status', '==', 'active'),
    );
    const snapshot = await getDocs(q).catch(() => null);
    if (!snapshot) return [];

    return snapshot.docs
      .map((docSnap) =>
        toWorkspaceDomainInvite(
          docSnap.id,
          docSnap.data() as FirestoreWorkspaceDomainInviteDoc,
        ),
      )
      .filter((invite) => invite.status === 'active');
  }

  async createSyncedWorkspace(
    name: string,
    owner: AuthUser,
  ): Promise<{ workspace: Workspace; membership: WorkspaceMembership }> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Workspace name is required.');

    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, doc, serverTimestamp, writeBatch } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const workspaceRef = doc(collection(firestore, 'workspaces'));
    const timestamp = serverTimestamp();
    const now = new Date();
    const workspace: Workspace = {
      id: workspaceRef.id,
      name: cleanName,
      ownerId: owner.uid,
      createdAt: now,
      updatedAt: now,
    };
    const memberPayload = createWorkspaceMemberPayload(workspace, owner, 'owner', timestamp);
    const membershipPayload = createWorkspaceMembershipPayload(workspace, owner, 'owner', timestamp);
    const memberRef = doc(firestore, 'workspaces', workspace.id, 'members', owner.uid);
    const membershipRef = doc(
      firestore,
      'workspaceMemberships',
      workspaceMembershipId(workspace.id, owner.uid),
    );

    const batch = writeBatch(firestore);
    batch.set(workspaceRef, {
      name: workspace.name,
      ownerId: workspace.ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    batch.set(memberRef, memberPayload);
    batch.set(membershipRef, membershipPayload);
    await batch.commit();

    return {
      workspace,
      membership: toWorkspaceMembership(membershipRef.id, {
        ...membershipPayload,
        joinedAt: undefined,
        updatedAt: undefined,
      }),
    };
  }

  async createInvite(
    workspace: Workspace,
    email: string,
    role: WorkspaceInviteRole,
    invitedBy: string,
  ): Promise<WorkspaceInvite> {
    const normalizedEmail = normalizeWorkspaceEmail(email);
    if (!normalizedEmail) throw new Error('Invite email is required.');

    const existing = (await this.listInvites(workspace.id)).find(
      (invite) => invite.email === normalizedEmail,
    );
    if (existing) return existing;

    const { getFirebaseFirestore } = await import('../firebase/config');
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const timestamp = serverTimestamp();
    const now = new Date();
    const invitesCol = collection(firestore, 'workspaceInvites');
    const docRef = await addDoc(invitesCol, {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      email: normalizedEmail,
      role,
      status: 'pending',
      invitedBy,
      createdAt: timestamp,
      updatedAt: timestamp,
      acceptedAt: null,
      acceptedBy: null,
    });

    return {
      id: docRef.id,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      email: normalizedEmail,
      role,
      status: 'pending',
      invitedBy,
      createdAt: now,
      updatedAt: now,
      acceptedAt: null,
      acceptedBy: null,
    };
  }

  async createDomainInvite(
    workspace: Workspace,
    domain: string,
    invitedBy: string,
  ): Promise<WorkspaceDomainInvite> {
    const cleanDomain = assertValidWorkspaceDomain(domain);
    const id = workspaceDomainInviteId(workspace.id, cleanDomain);

    const { getFirebaseFirestore } = await import('../firebase/config');
    const {
      collection,
      doc,
      getDocs,
      query,
      serverTimestamp,
      setDoc,
      where,
    } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const inviteRef = doc(firestore, 'workspaceDomainInvites', id);
    const existingQuery = query(
      collection(firestore, 'workspaceDomainInvites'),
      where('workspaceId', '==', workspace.id),
      where('domain', '==', cleanDomain),
    );
    const existingSnapshot = await getDocs(existingQuery);
    const existingDoc = existingSnapshot.docs[0];

    if (existingDoc) {
      const existingInvite = toWorkspaceDomainInvite(
        existingDoc.id,
        existingDoc.data() as FirestoreWorkspaceDomainInviteDoc,
      );
      if (existingInvite.status === 'active') return existingInvite;
    }

    const timestamp = serverTimestamp();
    const now = new Date();
    const payload = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      ownerId: workspace.ownerId,
      domain: cleanDomain,
      role: 'viewer' as const,
      status: 'active' as const,
      invitedBy,
      createdAt: timestamp,
      updatedAt: timestamp,
      revokedAt: null,
      revokedBy: null,
    };

    await setDoc(inviteRef, payload);

    return {
      id,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      ownerId: workspace.ownerId,
      domain: cleanDomain,
      role: 'viewer',
      status: 'active',
      invitedBy,
      createdAt: now,
      updatedAt: now,
      revokedAt: null,
      revokedBy: null,
    };
  }

  async acceptInvite(invite: WorkspaceInvite, user: AuthUser): Promise<WorkspaceMember> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, getDoc, serverTimestamp, writeBatch } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const workspaceRef = doc(firestore, 'workspaces', invite.workspaceId);
    const workspaceSnapshot = await getDoc(workspaceRef);
    if (!workspaceSnapshot.exists()) {
      throw new Error('Workspace no longer exists.');
    }

    const workspace = toWorkspace(
      workspaceSnapshot.id,
      workspaceSnapshot.data() as FirestoreWorkspaceDoc,
    );
    const timestamp = serverTimestamp();
    const memberPayload = createWorkspaceMemberPayload(
      workspace,
      user,
      invite.role,
      timestamp,
      { acceptedInviteId: invite.id },
    );
    const membershipPayload = createWorkspaceMembershipPayload(
      workspace,
      user,
      invite.role,
      timestamp,
      { acceptedInviteId: invite.id },
    );

    const memberRef = doc(firestore, 'workspaces', workspace.id, 'members', user.uid);
    const membershipRef = doc(
      firestore,
      'workspaceMemberships',
      workspaceMembershipId(workspace.id, user.uid),
    );
    const inviteRef = doc(firestore, 'workspaceInvites', invite.id);

    const batch = writeBatch(firestore);
    batch.set(memberRef, memberPayload);
    batch.set(membershipRef, membershipPayload);
    batch.update(inviteRef, {
      status: 'accepted',
      acceptedAt: timestamp,
      acceptedBy: user.uid,
      updatedAt: timestamp,
    });
    await batch.commit();

    return toWorkspaceMember(user.uid, {
      ...memberPayload,
      joinedAt: undefined,
      updatedAt: undefined,
    });
  }

  async acceptDomainInvite(
    invite: WorkspaceDomainInvite,
    user: AuthUser,
  ): Promise<WorkspaceMember> {
    if (invite.status !== 'active') {
      throw new Error('Domain invite is no longer active.');
    }
    if (getWorkspaceDomainFromEmail(user.email) !== invite.domain) {
      throw new Error('Your account email does not match this domain invite.');
    }

    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, serverTimestamp, writeBatch } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const workspace: Workspace = {
      id: invite.workspaceId,
      name: invite.workspaceName,
      ownerId: invite.ownerId,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
    };
    const timestamp = serverTimestamp();
    const acceptedMetadata = { acceptedDomainInviteId: invite.id };
    const memberPayload = createWorkspaceMemberPayload(
      workspace,
      user,
      'viewer',
      timestamp,
      acceptedMetadata,
    );
    const membershipPayload = createWorkspaceMembershipPayload(
      workspace,
      user,
      'viewer',
      timestamp,
      acceptedMetadata,
    );

    const memberRef = doc(firestore, 'workspaces', workspace.id, 'members', user.uid);
    const membershipRef = doc(
      firestore,
      'workspaceMemberships',
      workspaceMembershipId(workspace.id, user.uid),
    );

    const batch = writeBatch(firestore);
    batch.set(memberRef, memberPayload);
    batch.set(membershipRef, membershipPayload);
    await batch.commit();

    return toWorkspaceMember(user.uid, {
      ...memberPayload,
      joinedAt: undefined,
      updatedAt: undefined,
    });
  }

  async deleteSyncedWorkspace(workspaceId: string): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const {
      collection,
      doc,
      getDocs,
      query,
      serverTimestamp,
      where,
      writeBatch,
    } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const maxBatchOperations = 450;
    const workspaceRef = doc(firestore, 'workspaces', workspaceId);
    const membersSnapshot = await getDocs(collection(firestore, 'workspaces', workspaceId, 'members'));
    const promptsSnapshot = await getDocs(collection(firestore, 'workspaces', workspaceId, 'prompts'));
    const foldersSnapshot = await getDocs(collection(firestore, 'workspaces', workspaceId, 'folders'));
    const conflictsSnapshot = await getDocs(collection(firestore, 'workspaces', workspaceId, 'conflicts'));
    const invitesSnapshot = await getDocs(
      query(collection(firestore, 'workspaceInvites'), where('workspaceId', '==', workspaceId)),
    );
    const domainInvitesSnapshot = await getDocs(
      query(collection(firestore, 'workspaceDomainInvites'), where('workspaceId', '==', workspaceId)),
    );

    const promptVersionSnapshots = await Promise.all(
      promptsSnapshot.docs.map((promptDoc) =>
        getDocs(collection(
          firestore,
          'workspaces',
          workspaceId,
          'prompts',
          promptDoc.id,
          'versions',
        )),
      ),
    );
    const timestamp = serverTimestamp();
    const writeOperations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
    const finalWriteOperations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

    const commitOperations = async (
      operations: Array<(batch: ReturnType<typeof writeBatch>) => void>,
    ) => {
      for (let index = 0; index < operations.length; index += maxBatchOperations) {
        const batch = writeBatch(firestore);
        operations.slice(index, index + maxBatchOperations).forEach((operation) => {
          operation(batch);
        });
        await batch.commit();
      }
    };

    invitesSnapshot.docs.forEach((inviteDoc) => {
      writeOperations.push((batch) => batch.update(inviteDoc.ref, {
        status: 'revoked',
        updatedAt: timestamp,
      }));
    });
    domainInvitesSnapshot.docs.forEach((inviteDoc) => {
      writeOperations.push((batch) => batch.update(inviteDoc.ref, {
        status: 'revoked',
        revokedAt: timestamp,
        revokedBy: null,
        updatedAt: timestamp,
      }));
    });
    membersSnapshot.docs.forEach((memberDoc) => {
      const data = memberDoc.data() as FirestoreWorkspaceMemberDoc;
      const memberUserId = data.userId || memberDoc.id;
      const operations = data.role === 'owner' ? finalWriteOperations : writeOperations;
      operations.push((batch) => batch.delete(memberDoc.ref));
      operations.push((batch) => batch.delete(doc(
        firestore,
        'workspaceMemberships',
        workspaceMembershipId(workspaceId, memberUserId),
      )));
    });
    promptVersionSnapshots.forEach((snapshot) => {
      snapshot.docs.forEach((versionDoc) => {
        writeOperations.push((batch) => batch.delete(versionDoc.ref));
      });
    });
    promptsSnapshot.docs.forEach((promptDoc) => {
      writeOperations.push((batch) => batch.delete(promptDoc.ref));
    });
    foldersSnapshot.docs.forEach((folderDoc) => {
      writeOperations.push((batch) => batch.delete(folderDoc.ref));
    });
    conflictsSnapshot.docs.forEach((conflictDoc) => {
      writeOperations.push((batch) => batch.delete(conflictDoc.ref));
    });
    finalWriteOperations.push((batch) => batch.delete(workspaceRef));

    await commitOperations(writeOperations);
    if (finalWriteOperations.length > maxBatchOperations) {
      throw new Error('Workspace has too many owner records to delete in a single final batch.');
    }
    await commitOperations(finalWriteOperations);
  }

  async leaveSyncedWorkspace(workspaceId: string, userId: string): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, writeBatch } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const memberRef = doc(firestore, 'workspaces', workspaceId, 'members', userId);
    const membershipRef = doc(
      firestore,
      'workspaceMemberships',
      workspaceMembershipId(workspaceId, userId),
    );
    const batch = writeBatch(firestore);
    batch.delete(memberRef);
    batch.delete(membershipRef);
    await batch.commit();
  }

  async updateMemberRole(
    workspaceId: string,
    memberUserId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, getDoc, serverTimestamp, writeBatch } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const timestamp = serverTimestamp();
    const memberRef = doc(firestore, 'workspaces', workspaceId, 'members', memberUserId);
    const membershipRef = doc(
      firestore,
      'workspaceMemberships',
      workspaceMembershipId(workspaceId, memberUserId),
    );

    const batch = writeBatch(firestore);
    batch.update(memberRef, { role, updatedAt: timestamp });
    batch.update(membershipRef, { role, updatedAt: timestamp });
    await batch.commit();

    const updated = await getDoc(memberRef);
    if (!updated.exists()) throw new Error(`Member not found: ${memberUserId}`);
    return toWorkspaceMember(updated.id, updated.data() as FirestoreWorkspaceMemberDoc);
  }

  async removeMember(workspaceId: string, memberUserId: string): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, writeBatch } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const memberRef = doc(firestore, 'workspaces', workspaceId, 'members', memberUserId);
    const membershipRef = doc(
      firestore,
      'workspaceMemberships',
      workspaceMembershipId(workspaceId, memberUserId),
    );
    const batch = writeBatch(firestore);
    batch.delete(memberRef);
    batch.delete(membershipRef);
    await batch.commit();
  }

  async revokeDomainInvite(inviteId: string): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const inviteRef = doc(firestore, 'workspaceDomainInvites', inviteId);
    const timestamp = serverTimestamp();
    await updateDoc(inviteRef, {
      status: 'revoked',
      revokedAt: timestamp,
      revokedBy: null,
      updatedAt: timestamp,
    });
  }

  async revokeInvite(inviteId: string): Promise<void> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, serverTimestamp, updateDoc } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const inviteRef = doc(firestore, 'workspaceInvites', inviteId);
    await updateDoc(inviteRef, {
      status: 'revoked',
      updatedAt: serverTimestamp(),
    });
  }
}
