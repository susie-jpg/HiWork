# HiWork

HiWork is an enterprise-ready workspace for AI agents, models, company knowledge,
and repeatable team workflows. It provides a desktop application and WebUI with
runtime white-label configuration, enterprise identity boundaries, and a
deployment path that does not require maintaining a permanent UI fork.

## Highlights

- One workspace for built-in and external AI agents
- Runtime brand name, logo, and sign-in configuration
- OIDC and SAML entry points for an enterprise gateway or backend
- Organization, role, and permission claims with default-deny helpers
- Secret-reference and audit-event contracts that reject sensitive values
- Local password fallback without browser-side password persistence
- Desktop, remote WebUI, scheduled work, tools, skills, and multi-agent teams
- Docker and Kubernetes deployment examples
- Responsive UI with 13 supported language packs

## Development

Prerequisites: Bun 1.3+, Node.js 22-24, and platform build tools required by
Electron dependencies.

```bash
bun install --frozen-lockfile
bun start
```

Build and test:

```bash
bun run package
bun run test
bunx tsc --noEmit
node scripts/check-i18n.js
```

For a browser-only local preview after building:

```bash
python -m http.server 25901 --directory out/renderer
```

## Enterprise configuration

Edit or replace `public/enterprise-config.json` during deployment:

```json
{
  "brandName": "HiWork",
  "logoUrl": "/branding/company-logo.png",
  "passwordLoginEnabled": false,
  "authProviders": [
    {
      "id": "workforce-oidc",
      "protocol": "oidc",
      "label": "Company SSO",
      "loginUrl": "/api/auth/oidc/start"
    }
  ]
}
```

See [enterprise access](./docs/guides/enterprise-access.md) for the identity and
session contract, and [enterprise security](./docs/guides/enterprise-security.md)
for RBAC, audit, and secret-management boundaries.

The Kubernetes example is available at
[`deploy/kubernetes/enterprise-workspace.yaml`](./deploy/kubernetes/enterprise-workspace.yaml).

## Security boundary

Frontend permission checks only control presentation. The backend or enterprise
gateway must verify the authenticated organization, permission, and resource
scope for every protected request. Client secrets, signing keys, API keys,
refresh tokens, and SAML private material must never be placed in runtime browser
configuration.

## Upstream and license

HiWork is based on the [upstream iOfficeAI project](https://github.com/iOfficeAI/aionui) and
retains its Apache License 2.0 license and copyright notices. See
[LICENSE](./LICENSE) and [NOTICE](./NOTICE). Upstream names, links, and internal
compatibility identifiers may remain where required for upstream interoperability
and data migration; they do not represent HiWork branding.
