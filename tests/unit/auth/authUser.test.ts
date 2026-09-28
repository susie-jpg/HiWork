import { describe, expect, it } from 'vitest';
import { hasPermission, normalizeAuthUser } from '../../../packages/desktop/src/renderer/hooks/context/authIdentity';

describe('enterprise auth user', () => {
  it('keeps legacy users compatible with empty enterprise claims', () => {
    expect(normalizeAuthUser({ id: 'user-1', username: 'admin' })).toEqual({
      id: 'user-1',
      username: 'admin',
      displayName: undefined,
      email: undefined,
      organization: undefined,
      roles: [],
      permissions: [],
    });
  });

  it('normalizes organization, roles, and permissions from an enterprise session', () => {
    const user = normalizeAuthUser({
      id: 'user-2',
      username: 'susie',
      displayName: 'Susie',
      email: 'susie@example.com',
      organization: { id: 'org-1', name: 'Example Corp' },
      roles: ['admin', 42, ''],
      permissions: ['agents.manage', 'audit.read'],
    });

    expect(user?.organization?.name).toBe('Example Corp');
    expect(user?.roles).toEqual(['admin']);
    expect(hasPermission(user, 'audit.read')).toBe(true);
  });

  it('rejects malformed identities and denies missing permissions', () => {
    expect(normalizeAuthUser({ id: 'user-3' })).toBeNull();
    expect(hasPermission(null, 'agents.manage')).toBe(false);
  });

  it('supports an explicit wildcard permission', () => {
    const user = normalizeAuthUser({ id: 'user-4', username: 'owner', permissions: ['*'] });
    expect(hasPermission(user, 'organization.settings.write')).toBe(true);
  });
});
