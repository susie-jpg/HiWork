# Enterprise access configuration

The WebUI reads `enterprise-config.json` before React starts. Deployments can replace this file after packaging, so branding and identity-provider entry points do not require a source-code fork.

## Runtime configuration

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

`brandName` and `logoUrl` control the login identity. `passwordLoginEnabled` can disable local password entry. Each provider needs a stable `id`, an `oidc` or `saml` protocol, and an HTTP(S) login URL. Invalid providers and unsafe URL schemes are ignored.

The default file is copied from `public/enterprise-config.json` to the renderer output during packaging. In Kubernetes, mount a ConfigMap over the packaged `enterprise-config.json`; in a container image, replace that file during the final image stage. Keep logos on the same origin when possible.

## Identity-provider contract

The configured `loginUrl` is a navigation endpoint, not a token endpoint. It must:

1. Generate and persist OIDC state and nonce, or a SAML request identifier.
2. Redirect the browser to the enterprise identity provider.
3. Validate the callback, signature, issuer, audience, state, nonce, and timestamps.
4. Map the external subject to an internal user and organization membership.
5. Create the same HttpOnly application session used by password login.
6. Redirect to `/` after success or `/login?error=<stable-code>` after failure.

Client secrets, signing keys, refresh tokens, and SAML certificates must never be placed in `enterprise-config.json` or browser storage. Keep them in the backend or an enterprise identity-aware proxy. The current HiWork backend does not expose a stable built-in OIDC/SAML API, so deployments must provide these endpoints through the backend or gateway before enabling a provider.

## Reverse proxy

Provider endpoints under `/api/*` already pass through the bundled WebUI reverse proxy. For an external gateway, preserve `Set-Cookie`, `Location`, `X-Forwarded-Proto`, and the public host. Enforce HTTPS before enabling remote enterprise access.

## Session identity and RBAC

After authentication, `/api/auth/user` may extend the legacy `{ id, username }` response with enterprise claims:

```json
{
  "success": true,
  "user": {
    "id": "user-42",
    "username": "susie",
    "displayName": "Susie",
    "email": "susie@example.com",
    "organization": {
      "id": "org-1",
      "name": "Example Corp"
    },
    "roles": ["workspace-admin"],
    "permissions": ["agents.manage", "audit.read"]
  }
}
```

The renderer validates this shape and treats missing roles and permissions as empty lists. `*` is the explicit wildcard permission. Invalid identities are rejected instead of being partially trusted.

Frontend permission checks are only presentation controls. Every protected backend route must independently verify the authenticated organization, role, permission, and resource scope. Never authorize an operation from claims submitted in a browser request body.

## Example Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-workspace-login
data:
  enterprise-config.json: |
    {
      "brandName": "HiWork",
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
