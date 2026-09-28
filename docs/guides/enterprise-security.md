# Enterprise security boundaries

This repository provides browser-side integration contracts. Authentication,
authorization, audit durability, and secret custody remain backend concerns.

## Secret references

Browser configuration may contain a reference such as `provider/openai-prod`,
but never the referenced value. Resolve references in the backend from a secret
manager, inject the value only into the target process, and redact it from logs,
errors, telemetry, exports, and audit metadata.

```json
{
  "id": "openai-prod",
  "type": "openai-compatible",
  "baseUrl": "https://gateway.example.com/v1",
  "credential": { "kind": "secretRef", "ref": "provider/openai-prod" },
  "organizationId": "org-1",
  "enabled": true
}
```

Credential creation and rotation APIs should be write-only: accept the secret
once, return a reference and fingerprint, and never return the secret.

## Audit event contract

Every security-relevant backend mutation should append an immutable event:

```json
{
  "id": "evt_01J...",
  "occurredAt": "2026-09-28T08:00:00.000Z",
  "organizationId": "org-1",
  "actor": { "type": "user", "id": "user-42", "display": "Susie" },
  "action": "identity.provider.updated",
  "target": { "type": "identity-provider", "id": "workforce-oidc" },
  "outcome": "success",
  "requestId": "req_01J...",
  "sourceIp": "203.0.113.10",
  "metadata": { "changedFields": ["issuer", "scopes"] }
}
```

Never include passwords, tokens, cookies, authorization headers, API keys,
private prompts, uploaded file contents, or raw identity assertions. Enforce
organization scope in storage queries and exports. Protect audit access with
`audit.read` and use append-only storage with a documented retention policy.

## Required backend permissions

| Permission                  | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `organization.read`         | View organization identity and policy         |
| `organization.manage`       | Change organization policy                    |
| `identity.providers.manage` | Configure OIDC or SAML providers              |
| `providers.manage`          | Configure model providers by secret reference |
| `audit.read`                | Search and export organization audit events   |

Frontend visibility is not authorization. Re-evaluate the session,
organization, permission, and resource ownership on every protected request.
