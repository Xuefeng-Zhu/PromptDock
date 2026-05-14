const DOMAIN_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normalizeWorkspaceDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, '');
}

export function getWorkspaceDomainFromEmail(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf('@');
  if (atIndex < 0 || atIndex === normalizedEmail.length - 1) return '';
  return normalizeWorkspaceDomain(normalizedEmail.slice(atIndex + 1));
}

export function assertValidWorkspaceDomain(value: string): string {
  const domain = normalizeWorkspaceDomain(value);
  if (!DOMAIN_PATTERN.test(domain)) {
    throw new Error('Enter a domain like example.com.');
  }
  return domain;
}

export function workspaceDomainInviteId(workspaceId: string, domain: string): string {
  return `${workspaceId}_${domain}`;
}
