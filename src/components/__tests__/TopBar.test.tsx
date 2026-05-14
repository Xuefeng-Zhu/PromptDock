// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TopBar } from '../top-bar';
import type { IAuthService } from '../../services/interfaces';
import type {
  AuthResult,
  AuthUser,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceMembership,
} from '../../types/index';
import type { IWorkspaceRepository } from '../../repositories/interfaces';
import { initWorkspaceStore } from '../../stores/workspace-store';

const defaultProps = {
  searchQuery: '',
  onSearchChange: vi.fn(),
  onCommandPaletteOpen: vi.fn(),
};

function createMockAuthService(overrides: Partial<IAuthService> = {}): IAuthService {
  return {
    signIn: vi.fn(async (): Promise<AuthResult> => ({
      success: true,
      user: { uid: 'user-123', email: 'test@example.com', displayName: null },
    })),
    signUp: vi.fn(async (): Promise<AuthResult> => ({
      success: true,
      user: { uid: 'user-456', email: 'new@example.com', displayName: null },
    })),
    signInWithGoogle: vi.fn(async (): Promise<AuthResult> => ({
      success: true,
      user: { uid: 'google-user', email: 'google@example.com', displayName: 'Google User' },
    })),
    signOut: vi.fn(async () => {}),
    restoreSession: vi.fn(async () => null),
    sendPasswordReset: vi.fn(async () => {}),
    onAuthStateChanged: vi.fn(() => () => {}),
    ...overrides,
  };
}

function createMockWorkspaceRepo(): IWorkspaceRepository {
  const user: AuthUser = { uid: 'user-123', email: 'test@example.com', displayName: 'Test User' };
  const workspace: Workspace = {
    id: user.uid,
    name: 'Personal Workspace',
    ownerId: user.uid,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
  const membership: WorkspaceMembership = {
    id: `${workspace.id}_${user.uid}`,
    workspaceId: workspace.id,
    userId: user.uid,
    role: 'owner',
    email: user.email,
    displayName: user.displayName,
    workspaceName: workspace.name,
    ownerId: user.uid,
    joinedAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
  const member: WorkspaceMember = {
    id: user.uid,
    workspaceId: workspace.id,
    userId: user.uid,
    role: 'owner',
    email: user.email,
    displayName: user.displayName,
    joinedAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };

  return {
    create: vi.fn(async () => workspace),
    getById: vi.fn(async () => workspace),
    listForUser: vi.fn(async () => [workspace]),
    listSyncedWorkspacesForUser: vi.fn(async () => [workspace]),
    update: vi.fn(async (_id, changes) => ({ ...workspace, ...changes })),
    updateSyncedWorkspace: vi.fn(async (_id, changes) => ({ ...workspace, ...changes })),
    bootstrapPersonalWorkspace: vi.fn(async () => workspace),
    listMembershipsForUser: vi.fn(async () => [membership]),
    listPendingDomainInvitesForEmail: vi.fn(async () => []),
    listPendingInvitesForEmail: vi.fn(async () => [] as WorkspaceInvite[]),
    listDomainInvites: vi.fn(async () => []),
    listMembers: vi.fn(async () => [member]),
    listInvites: vi.fn(async () => [] as WorkspaceInvite[]),
    createSyncedWorkspace: vi.fn(async () => ({ workspace, membership })),
    createInvite: vi.fn(async () => {
      throw new Error('not used');
    }),
    createDomainInvite: vi.fn(async () => {
      throw new Error('not used');
    }),
    acceptInvite: vi.fn(async () => member),
    acceptDomainInvite: vi.fn(async () => member),
    deleteSyncedWorkspace: vi.fn(async () => {}),
    leaveSyncedWorkspace: vi.fn(async () => {}),
    updateMemberRole: vi.fn(async () => member),
    removeMember: vi.fn(async () => {}),
    revokeDomainInvite: vi.fn(async () => {}),
    revokeInvite: vi.fn(async () => {}),
  };
}

describe('TopBar', () => {
  beforeEach(() => {
    initWorkspaceStore(createMockWorkspaceRepo());
  });

  it('renders "PromptDock" title', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('PromptDock')).toBeDefined();
  });

  it('renders search bar with placeholder', () => {
    render(<TopBar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search…');
    expect(input).toBeDefined();
    expect(input.getAttribute('type')).toBe('search');
  });

  it('renders search bar with aria-label', () => {
    render(<TopBar {...defaultProps} />);
    const input = screen.getByLabelText('Search prompts');
    expect(input).toBeDefined();
  });

  it('renders ⌘K shortcut hint', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('⌘K')).toBeDefined();
  });

  it('renders account icon button with aria-label', () => {
    render(<TopBar {...defaultProps} />);
    const accountBtn = screen.getByRole('button', { name: 'Account' });
    expect(accountBtn).toBeDefined();
  });

  it('renders a mobile navigation trigger when provided', () => {
    const onMobileNavToggle = vi.fn();
    render(
      <TopBar
        {...defaultProps}
        mobileNavOpen={false}
        onMobileNavToggle={onMobileNavToggle}
      />,
    );

    const menuButton = screen.getByRole('button', { name: 'Open navigation' });
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(menuButton);
    expect(onMobileNavToggle).toHaveBeenCalledTimes(1);
  });

  it('reflects the mobile navigation expanded state', () => {
    render(
      <TopBar
        {...defaultProps}
        mobileNavOpen
        onMobileNavToggle={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('opens a signed-out account form in the dropdown', () => {
    render(<TopBar {...defaultProps} authService={createMockAuthService()} syncStatus="local" />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByRole('dialog', { name: 'Account' })).toBeDefined();
    expect(screen.getByLabelText('Email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign in to account' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDefined();
  });

  it('submits sign-in from the account dropdown', async () => {
    const authService = createMockAuthService();
    const onAuthSuccess = vi.fn();
    render(<TopBar {...defaultProps} authService={authService} onAuthSuccess={onAuthSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to account' }));

    expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    await waitFor(() => {
      expect(onAuthSuccess).toHaveBeenCalledWith({
        uid: 'user-123',
        email: 'test@example.com',
        displayName: null,
      });
    });
  });

  it('switches the account dropdown to sign-up mode', () => {
    render(<TopBar {...defaultProps} authService={createMockAuthService()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(screen.getByRole('button', { name: 'Create account' })).toBeDefined();
  });

  it('shows signed-in account info and signs out from the dropdown', async () => {
    const authService = createMockAuthService({
      onAuthStateChanged: vi.fn((callback) => {
        callback({
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        });
        return () => {};
      }),
    });
    const onSignOutSuccess = vi.fn();

    render(
      <TopBar
        {...defaultProps}
        authService={authService}
        mode="synced"
        userId="user-123"
        syncStatus="synced"
        onSignOutSuccess={onSignOutSuccess}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));

    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));

    expect(authService.signOut).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(onSignOutSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('closes the workspace menu after opening sharing settings', () => {
    const onManageWorkspaces = vi.fn();

    render(
      <TopBar
        {...defaultProps}
        mode="synced"
        syncStatus="synced"
        onManageWorkspaces={onManageWorkspaces}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Switch workspace' }));
    expect(screen.getByRole('dialog', { name: 'Workspaces' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Manage sharing/i }));

    expect(onManageWorkspaces).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Workspaces' })).toBeNull();
  });

  it('shows colorful workspace markers in synced workspace controls', () => {
    render(
      <TopBar
        {...defaultProps}
        mode="synced"
        syncStatus="synced"
      />,
    );

    expect(screen.getByTestId('workspace-color-mark')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Switch workspace' }));

    expect(screen.getAllByTestId('workspace-color-mark').length).toBeGreaterThan(1);
  });

  it('closes the account dropdown with Escape', () => {
    render(<TopBar {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    expect(screen.getByRole('dialog', { name: 'Account' })).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Account' })).toBeNull();
  });

  it('calls onSearchChange when typing in the search bar', () => {
    const onSearchChange = vi.fn();
    render(<TopBar {...defaultProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onSearchChange).toHaveBeenCalledWith('hello');
  });

  it('calls onCommandPaletteOpen when clicking the search bar', () => {
    const onCommandPaletteOpen = vi.fn();
    render(<TopBar {...defaultProps} onCommandPaletteOpen={onCommandPaletteOpen} />);
    const input = screen.getByPlaceholderText('Search…');
    fireEvent.click(input);
    expect(onCommandPaletteOpen).toHaveBeenCalledTimes(1);
  });

  it('displays the current search query value', () => {
    render(<TopBar {...defaultProps} searchQuery="test query" />);
    const input = screen.getByPlaceholderText('Search…') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('renders as a header element', () => {
    const { container } = render(<TopBar {...defaultProps} />);
    expect(container.querySelector('header')).toBeDefined();
  });
});
