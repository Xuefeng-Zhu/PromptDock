import type {
  AuthUser,
  Workspace,
  WorkspaceInvite,
  WorkspaceInviteRole,
  WorkspaceInviteStatus,
  WorkspaceMember,
  WorkspaceMembership,
  WorkspaceRole,
} from '../types/index';
import type { IStorageBackend, IWorkspaceRepository } from './interfaces';

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
}

function timestampToDate(timestamp: FirestoreTimestamp | Date | null | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1_000_000);
}

const LOCAL_WORKSPACE_ID = 'local';

interface FirestoreWorkspaceDoc {
  name: string;
  ownerId: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

interface FirestoreWorkspaceMemberDoc {
  id?: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  email?: string;
  displayName?: string | null;
  joinedAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  acceptedInviteId?: string;
}

interface FirestoreWorkspaceMembershipDoc {
  id?: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  email?: string;
  displayName?: string | null;
  workspaceName?: string;
  ownerId?: string;
  joinedAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

interface FirestoreWorkspaceInviteDoc {
  workspaceId: string;
  workspaceName?: string;
  email: string;
  role: WorkspaceInviteRole;
  status: WorkspaceInviteStatus;
  invitedBy: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  acceptedAt?: FirestoreTimestamp | null;
  acceptedBy?: string | null;
}

function workspaceMembershipId(workspaceId: string, userId: string): string {
  return `${workspaceId}_${userId}`;
}

function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toWorkspace(id: string, data: FirestoreWorkspaceDoc): Workspace {
  return {
    id,
    name: data.name,
    ownerId: data.ownerId,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

function toWorkspaceMember(id: string, data: FirestoreWorkspaceMemberDoc): WorkspaceMember {
  return {
    id: data.id ?? id,
    workspaceId: data.workspaceId,
    userId: data.userId,
    role: data.role,
    email: data.email ?? '',
    displayName: data.displayName ?? null,
    joinedAt: timestampToDate(data.joinedAt),
    updatedAt: timestampToDate(data.updatedAt),
    ...(data.acceptedInviteId ? { acceptedInviteId: data.acceptedInviteId } : {}),
  };
}

function toWorkspaceMembership(
  id: string,
  data: FirestoreWorkspaceMembershipDoc,
): WorkspaceMembership {
  return {
    id: data.id ?? id,
    workspaceId: data.workspaceId,
    userId: data.userId,
    role: data.role,
    email: data.email ?? '',
    displayName: data.displayName ?? null,
    workspaceName: data.workspaceName ?? 'Workspace',
    ownerId: data.ownerId ?? '',
    joinedAt: timestampToDate(data.joinedAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
}

function toWorkspaceInvite(id: string, data: FirestoreWorkspaceInviteDoc): WorkspaceInvite {
  return {
    id,
    workspaceId: data.workspaceId,
    workspaceName: data.workspaceName ?? 'Workspace',
    email: data.email,
    role: data.role,
    status: data.status,
    invitedBy: data.invitedBy,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
    acceptedAt: data.acceptedAt ? timestampToDate(data.acceptedAt) : null,
    acceptedBy: data.acceptedBy ?? null,
  };
}

function createMemberPayload(
  workspace: Workspace,
  user: AuthUser,
  role: WorkspaceRole,
  timestamp: unknown,
  acceptedInviteId?: string,
) {
  return {
    id: user.uid,
    workspaceId: workspace.id,
    userId: user.uid,
    role,
    email: normalizeInviteEmail(user.email),
    displayName: user.displayName,
    joinedAt: timestamp,
    updatedAt: timestamp,
    ...(acceptedInviteId ? { acceptedInviteId } : {}),
  };
}

function createMembershipPayload(
  workspace: Workspace,
  user: AuthUser,
  role: WorkspaceRole,
  timestamp: unknown,
  acceptedInviteId?: string,
) {
  return {
    ...createMemberPayload(workspace, user, role, timestamp, acceptedInviteId),
    workspaceName: workspace.name,
    ownerId: workspace.ownerId,
  };
}

function createPersonalWorkspaceFallback(userId: string): Workspace {
  const now = new Date();
  return {
    id: userId,
    name: 'Personal Workspace',
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  };
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
    const existingWorkspaceSnapshot = await getDoc(workspaceRef).catch((err) => {
      console.error('Failed to read personal workspace metadata before bootstrap:', err);
      return null;
    });
    const existingWorkspace = existingWorkspaceSnapshot?.exists()
      ? toWorkspace(
        existingWorkspaceSnapshot.id,
        existingWorkspaceSnapshot.data() as FirestoreWorkspaceDoc,
      )
      : null;
    const workspace: Workspace = {
      id: user.uid,
      name: 'Personal Workspace',
      ownerId: user.uid,
      createdAt: existingWorkspace?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    const memberPayload = createMemberPayload(workspace, user, 'owner', timestamp);
    const membershipPayload = createMembershipPayload(workspace, user, 'owner', timestamp);

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
    if (!existingWorkspace) {
      workspacePayload.createdAt = timestamp;
    }

    await setDoc(
      workspaceRef,
      workspacePayload,
      { merge: true },
    ).catch((err) => {
      console.error('Failed to bootstrap personal workspace metadata:', err);
    });

    await setDoc(memberRef, memberPayload, { merge: true }).catch((err) => {
      console.error('Failed to bootstrap personal workspace member:', err);
    });

    await setDoc(membershipRef, membershipPayload, { merge: true }).catch((err) => {
      console.error('Failed to bootstrap personal workspace membership index:', err);
    });

    return workspace;
  }

  async listMembershipsForUser(userId: string): Promise<WorkspaceMembership[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    try {
      const firestore = await getFirebaseFirestore();
      const membershipsCol = collection(firestore, 'workspaceMemberships');
      const q = query(membershipsCol, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const memberships = snapshot.docs.map((docSnap) =>
        toWorkspaceMembership(docSnap.id, docSnap.data() as FirestoreWorkspaceMembershipDoc),
      );

      return memberships.length > 0 ? memberships : [createPersonalMembershipFallback(userId)];
    } catch (err) {
      console.error('Failed to list workspace membership index; using personal workspace fallback:', err);
      return [createPersonalMembershipFallback(userId)];
    }
  }

  async listSyncedWorkspacesForUser(userId: string): Promise<Workspace[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { doc, getDoc } = await import('firebase/firestore');

    const firestore = await getFirebaseFirestore();
    const memberships = await this.listMembershipsForUser(userId);
    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        try {
          const workspaceRef = doc(firestore, 'workspaces', membership.workspaceId);
          const snapshot = await getDoc(workspaceRef);
          if (!snapshot.exists()) return null;
          return toWorkspace(snapshot.id, snapshot.data() as FirestoreWorkspaceDoc);
        } catch (err) {
          console.error('Failed to read workspace metadata:', err);
          return null;
        }
      }),
    );

    const availableWorkspaces = workspaces.filter((workspace): workspace is Workspace => workspace !== null);
    return availableWorkspaces.length > 0
      ? availableWorkspaces
      : [createPersonalWorkspaceFallback(userId)];
  }

  async listPendingInvitesForEmail(email: string): Promise<WorkspaceInvite[]> {
    const normalizedEmail = normalizeInviteEmail(email);
    if (!normalizedEmail) return [];

    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    try {
      const firestore = await getFirebaseFirestore();
      const invitesCol = collection(firestore, 'workspaceInvites');
      const q = query(invitesCol, where('email', '==', normalizedEmail));
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((docSnap) => toWorkspaceInvite(docSnap.id, docSnap.data() as FirestoreWorkspaceInviteDoc))
        .filter((invite) => invite.status === 'pending');
    } catch (err) {
      console.error('Failed to list pending workspace invites:', err);
      return [];
    }
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs } = await import('firebase/firestore');

    try {
      const firestore = await getFirebaseFirestore();
      const membersCol = collection(firestore, 'workspaces', workspaceId, 'members');
      const snapshot = await getDocs(membersCol);

      return snapshot.docs.map((docSnap) =>
        toWorkspaceMember(docSnap.id, docSnap.data() as FirestoreWorkspaceMemberDoc),
      );
    } catch (err) {
      console.error('Failed to list workspace members:', err);
      return [];
    }
  }

  async listInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
    const { getFirebaseFirestore } = await import('../firebase/config');
    const { collection, getDocs, query, where } = await import('firebase/firestore');

    try {
      const firestore = await getFirebaseFirestore();
      const invitesCol = collection(firestore, 'workspaceInvites');
      const q = query(invitesCol, where('workspaceId', '==', workspaceId));
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((docSnap) => toWorkspaceInvite(docSnap.id, docSnap.data() as FirestoreWorkspaceInviteDoc))
        .filter((invite) => invite.status === 'pending');
    } catch (err) {
      console.error('Failed to list outgoing workspace invites:', err);
      return [];
    }
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
    const memberPayload = createMemberPayload(workspace, owner, 'owner', timestamp);
    const membershipPayload = createMembershipPayload(workspace, owner, 'owner', timestamp);
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
    const normalizedEmail = normalizeInviteEmail(email);
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
    const memberPayload = createMemberPayload(workspace, user, invite.role, timestamp, invite.id);
    const membershipPayload = createMembershipPayload(
      workspace,
      user,
      invite.role,
      timestamp,
      invite.id,
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
