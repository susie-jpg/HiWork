import { describe, expect, it } from 'vitest';
import { normalizeAuditEvent, normalizeEnterpriseProvider } from '@/common/types/enterpriseSecurity';

describe('enterprise security contracts', () => {
  it('accepts a provider backed by a secret reference', () => {
    expect(
      normalizeEnterpriseProvider({
        id: 'openai-prod',
        type: 'openai-compatible',
        organizationId: 'org-1',
        baseUrl: 'https://gateway.example.com/v1',
        credential: { kind: 'secretRef', ref: 'provider/openai-prod', fingerprint: 'sha256:abcd' },
        enabled: true,
      })
    ).toMatchObject({ id: 'openai-prod', credential: { ref: 'provider/openai-prod' } });
  });

  it('rejects provider payloads containing plaintext secret fields', () => {
    expect(
      normalizeEnterpriseProvider({
        id: 'openai-prod',
        type: 'openai-compatible',
        organizationId: 'org-1',
        credential: { kind: 'secretRef', ref: 'provider/openai-prod' },
        apiKey: 'must-not-cross-the-boundary',
        enabled: true,
      })
    ).toBeNull();
  });

  it('accepts a scoped audit event without sensitive metadata', () => {
    expect(
      normalizeAuditEvent({
        id: 'evt-1',
        occurredAt: '2026-09-28T08:00:00.000Z',
        organizationId: 'org-1',
        actor: { type: 'user', id: 'user-1', display: 'Susie' },
        action: 'identity.provider.updated',
        target: { type: 'identity-provider', id: 'workforce-oidc' },
        outcome: 'success',
        metadata: { changedFields: ['issuer', 'scopes'] },
      })
    ).toMatchObject({ id: 'evt-1', outcome: 'success' });
  });

  it('rejects secrets nested inside audit metadata', () => {
    expect(
      normalizeAuditEvent({
        id: 'evt-1',
        occurredAt: '2026-09-28T08:00:00.000Z',
        organizationId: 'org-1',
        actor: { type: 'service', id: 'gateway' },
        action: 'provider.rotated',
        outcome: 'success',
        metadata: { details: { refreshToken: 'must-not-be-logged' } },
      })
    ).toBeNull();
  });
});
