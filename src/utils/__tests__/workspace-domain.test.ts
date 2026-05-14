import { describe, expect, it } from 'vitest';
import {
  assertValidWorkspaceDomain,
  getWorkspaceDomainFromEmail,
  normalizeWorkspaceDomain,
  workspaceDomainInviteId,
} from '../workspace-domain';

describe('workspace-domain utilities', () => {
  it('normalizes domains before persistence', () => {
    expect(normalizeWorkspaceDomain(' @Example.COM ')).toBe('example.com');
  });

  it('extracts exact account email domains', () => {
    expect(getWorkspaceDomainFromEmail('Person@Example.com')).toBe('example.com');
    expect(getWorkspaceDomainFromEmail('person@team.example.com')).toBe('team.example.com');
  });

  it('rejects empty or single-label domains', () => {
    expect(() => assertValidWorkspaceDomain('@')).toThrow('Enter a domain like example.com.');
    expect(() => assertValidWorkspaceDomain('example')).toThrow('Enter a domain like example.com.');
  });

  it('builds deterministic domain invite ids', () => {
    expect(workspaceDomainInviteId('workspace-1', 'example.com')).toBe(
      'workspace-1_example.com',
    );
  });
});
