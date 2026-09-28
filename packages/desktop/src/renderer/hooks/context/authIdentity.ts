export type AuthUser = {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  organization?: {
    id: string;
    name: string;
  };
  roles: string[];
  permissions: string[];
};

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '') : [];

export function normalizeAuthUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Record<string, unknown>;
  if (typeof payload.id !== 'string' || !payload.id || typeof payload.username !== 'string' || !payload.username) {
    return null;
  }

  const rawOrganization = payload.organization;
  const organization =
    rawOrganization &&
    typeof rawOrganization === 'object' &&
    typeof (rawOrganization as Record<string, unknown>).id === 'string' &&
    typeof (rawOrganization as Record<string, unknown>).name === 'string'
      ? {
          id: (rawOrganization as Record<string, string>).id,
          name: (rawOrganization as Record<string, string>).name,
        }
      : undefined;

  return {
    id: payload.id,
    username: payload.username,
    displayName: typeof payload.displayName === 'string' ? payload.displayName : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    organization,
    roles: stringList(payload.roles),
    permissions: stringList(payload.permissions),
  };
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  return Boolean(user?.permissions.includes('*') || user?.permissions.includes(permission));
}
