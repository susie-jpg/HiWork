export type SecretReference = {
  kind: 'secretRef';
  ref: string;
  fingerprint?: string;
};

export type EnterpriseProvider = {
  id: string;
  type: string;
  organizationId: string;
  baseUrl?: string;
  credential: SecretReference;
  enabled: boolean;
};

export type AuditEvent = {
  id: string;
  occurredAt: string;
  organizationId: string;
  actor: { type: 'user' | 'service'; id: string; display?: string };
  action: string;
  target?: { type: string; id: string };
  outcome: 'success' | 'failure';
  requestId?: string;
  sourceIp?: string;
  metadata: Record<string, unknown>;
};

const SENSITIVE_KEY = /(?:api[_-]?key|authorization|cookie|password|private[_-]?key|refresh[_-]?token|secret|token)/i;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;

const objectValue = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const requiredString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

export function normalizeSecretReference(value: unknown): SecretReference | null {
  const input = objectValue(value);
  if (!input || input.kind !== 'secretRef') return null;
  const ref = requiredString(input.ref);
  if (!ref || !SAFE_ID.test(ref)) return null;
  const fingerprint = input.fingerprint === undefined ? undefined : requiredString(input.fingerprint);
  if (input.fingerprint !== undefined && !fingerprint) return null;
  return { kind: 'secretRef', ref, fingerprint: fingerprint ?? undefined };
}

export function normalizeEnterpriseProvider(value: unknown): EnterpriseProvider | null {
  const input = objectValue(value);
  if (!input || Object.keys(input).some((key) => SENSITIVE_KEY.test(key) && key !== 'credential')) return null;
  const id = requiredString(input.id);
  const type = requiredString(input.type);
  const organizationId = requiredString(input.organizationId);
  const credential = normalizeSecretReference(input.credential);
  if (!id || !type || !organizationId || !credential || typeof input.enabled !== 'boolean') return null;
  if (![id, type, organizationId].every((item) => SAFE_ID.test(item))) return null;
  const baseUrl = input.baseUrl === undefined ? undefined : requiredString(input.baseUrl);
  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
    } catch {
      return null;
    }
  }
  return { id, type, organizationId, baseUrl, credential, enabled: input.enabled };
}

function containsSensitiveKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSensitiveKey);
  const record = objectValue(value);
  return record
    ? Object.entries(record).some(([key, child]) => SENSITIVE_KEY.test(key) || containsSensitiveKey(child))
    : false;
}

export function normalizeAuditEvent(value: unknown): AuditEvent | null {
  const input = objectValue(value);
  const actor = objectValue(input?.actor);
  const target = input?.target === undefined ? undefined : objectValue(input.target);
  const metadata = objectValue(input?.metadata);
  const id = requiredString(input?.id);
  const occurredAt = requiredString(input?.occurredAt);
  const organizationId = requiredString(input?.organizationId);
  const action = requiredString(input?.action);
  const actorId = requiredString(actor?.id);
  if (!input || !actor || !metadata || !id || !occurredAt || !organizationId || !action || !actorId) return null;
  if (!['user', 'service'].includes(String(actor.type)) || !['success', 'failure'].includes(String(input.outcome)))
    return null;
  if (Number.isNaN(Date.parse(occurredAt)) || containsSensitiveKey(metadata)) return null;
  if (target && (!requiredString(target.type) || !requiredString(target.id))) return null;
  return {
    id,
    occurredAt,
    organizationId,
    actor: { type: actor.type as 'user' | 'service', id: actorId, display: requiredString(actor.display) ?? undefined },
    action,
    target: target ? { type: String(target.type), id: String(target.id) } : undefined,
    outcome: input.outcome as 'success' | 'failure',
    requestId: requiredString(input.requestId) ?? undefined,
    sourceIp: requiredString(input.sourceIp) ?? undefined,
    metadata,
  };
}
