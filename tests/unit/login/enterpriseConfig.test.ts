import { describe, expect, it, vi } from 'vitest';
import {
  getEnterpriseLoginConfig,
  loadEnterpriseLoginConfig,
  resolveEnterpriseLoginConfig,
} from '../../../packages/desktop/src/renderer/pages/login/enterpriseConfig';

describe('enterprise login configuration', () => {
  it('uses a password-enabled white-label default when no runtime config is present', () => {
    expect(resolveEnterpriseLoginConfig()).toEqual({
      brandName: 'HiWork',
      passwordLoginEnabled: true,
      authProviders: [],
    });
  });

  it('accepts deploy-time branding and enterprise identity providers', () => {
    const config = resolveEnterpriseLoginConfig({
      brandName: 'Acme AI',
      logoUrl: '/branding/logo.png',
      passwordLoginEnabled: false,
      authProviders: [{ id: 'workforce', protocol: 'oidc', loginUrl: '/auth/oidc', label: 'Company SSO' }],
    });
    expect(config.brandName).toBe('Acme AI');
    expect(config.passwordLoginEnabled).toBe(false);
    expect(config.authProviders).toHaveLength(1);
  });

  it('drops malformed providers and unsafe URLs', () => {
    const config = resolveEnterpriseLoginConfig({
      logoUrl: 'javascript:alert(1)',
      authProviders: [
        { id: 'unsafe', protocol: 'saml', loginUrl: 'javascript:alert(1)' },
        { id: '', protocol: 'oidc', loginUrl: '/auth/oidc' },
      ],
    });
    expect(config.logoUrl).toBeUndefined();
    expect(config.authProviders).toEqual([]);
  });

  it('loads same-origin runtime configuration before the application starts', async () => {
    const runtime = globalThis as typeof globalThis & {
      __AION_ENTERPRISE_CONFIG__?: unknown;
      electronAPI?: unknown;
    };
    const electronAPI = runtime.electronAPI;
    delete runtime.__AION_ENTERPRISE_CONFIG__;
    delete runtime.electronAPI;
    const response = new Response(JSON.stringify({ brandName: 'Runtime Brand', passwordLoginEnabled: false }), {
      headers: { 'content-type': 'application/json' },
    });

    await loadEnterpriseLoginConfig(async () => response);

    expect(getEnterpriseLoginConfig().brandName).toBe('Runtime Brand');
    delete runtime.__AION_ENTERPRISE_CONFIG__;
    runtime.electronAPI = electronAPI;
  });

  it('keeps defaults when the runtime endpoint returns non-JSON content', async () => {
    const runtime = globalThis as typeof globalThis & { __AION_ENTERPRISE_CONFIG__?: unknown };
    delete runtime.__AION_ENTERPRISE_CONFIG__;

    await loadEnterpriseLoginConfig(
      async () => new Response('<html></html>', { headers: { 'content-type': 'text/html' } })
    );

    expect(getEnterpriseLoginConfig().brandName).toBe('HiWork');
  });

  it('keeps defaults when loading runtime configuration fails', async () => {
    const runtime = globalThis as typeof globalThis & {
      __AION_ENTERPRISE_CONFIG__?: unknown;
      electronAPI?: unknown;
    };
    const electronAPI = runtime.electronAPI;
    delete runtime.__AION_ENTERPRISE_CONFIG__;
    delete runtime.electronAPI;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await loadEnterpriseLoginConfig(async () => {
      throw new Error('network unavailable');
    });

    expect(getEnterpriseLoginConfig().brandName).toBe('HiWork');
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
    runtime.electronAPI = electronAPI;
  });
});
