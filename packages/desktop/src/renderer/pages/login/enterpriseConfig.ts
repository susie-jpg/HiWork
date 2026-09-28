export type EnterpriseAuthProvider = {
  id: string;
  protocol: 'oidc' | 'saml';
  loginUrl: string;
  label?: string;
};

export type EnterpriseLoginConfig = {
  brandName: string;
  logoUrl?: string;
  passwordLoginEnabled: boolean;
  authProviders: EnterpriseAuthProvider[];
};

export type RuntimeEnterpriseConfig = {
  brandName?: unknown;
  logoUrl?: unknown;
  passwordLoginEnabled?: unknown;
  authProviders?: unknown;
};

const DEFAULT_CONFIG: EnterpriseLoginConfig = {
  brandName: 'HiWork',
  passwordLoginEnabled: true,
  authProviders: [],
};

const safeUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  try {
    const url = new URL(value, globalThis.location?.origin ?? 'http://localhost');
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return value;
  } catch {
    return undefined;
  }
};

const parseProvider = (value: unknown): EnterpriseAuthProvider | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const provider = value as Record<string, unknown>;
  const loginUrl = safeUrl(provider.loginUrl);
  if (
    typeof provider.id !== 'string' ||
    provider.id.trim() === '' ||
    (provider.protocol !== 'oidc' && provider.protocol !== 'saml') ||
    !loginUrl
  ) {
    return undefined;
  }
  return {
    id: provider.id,
    protocol: provider.protocol,
    loginUrl,
    label: typeof provider.label === 'string' && provider.label.trim() ? provider.label : undefined,
  };
};

export const resolveEnterpriseLoginConfig = (runtime?: RuntimeEnterpriseConfig): EnterpriseLoginConfig => {
  const authProviders = Array.isArray(runtime?.authProviders)
    ? runtime.authProviders
        .map(parseProvider)
        .filter((provider): provider is EnterpriseAuthProvider => Boolean(provider))
    : [];
  return {
    brandName:
      typeof runtime?.brandName === 'string' && runtime.brandName.trim()
        ? runtime.brandName.trim()
        : DEFAULT_CONFIG.brandName,
    logoUrl: safeUrl(runtime?.logoUrl),
    passwordLoginEnabled:
      typeof runtime?.passwordLoginEnabled === 'boolean'
        ? runtime.passwordLoginEnabled
        : DEFAULT_CONFIG.passwordLoginEnabled,
    authProviders,
  };
};

export const getEnterpriseLoginConfig = (): EnterpriseLoginConfig => {
  const runtime = (globalThis as typeof globalThis & { __AION_ENTERPRISE_CONFIG__?: RuntimeEnterpriseConfig })
    .__AION_ENTERPRISE_CONFIG__;
  return resolveEnterpriseLoginConfig(runtime);
};

type ConfigFetch = (input: string, init?: RequestInit) => Promise<Response>;
const CONFIG_LOAD_TIMEOUT_MS = 1500;

export const loadEnterpriseLoginConfig = async (fetcher: ConfigFetch = fetch): Promise<void> => {
  const runtime = globalThis as typeof globalThis & {
    __AION_ENTERPRISE_CONFIG__?: RuntimeEnterpriseConfig;
    electronAPI?: unknown;
  };
  if (runtime.__AION_ENTERPRISE_CONFIG__ || runtime.electronAPI) return;

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), CONFIG_LOAD_TIMEOUT_MS);
  try {
    const response = await fetcher('/enterprise-config.json', {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;
    const config = (await response.json()) as unknown;
    if (config && typeof config === 'object') {
      runtime.__AION_ENTERPRISE_CONFIG__ = config as RuntimeEnterpriseConfig;
    }
  } catch (error) {
    console.warn('Enterprise login config is unavailable; using defaults.', error);
  } finally {
    globalThis.clearTimeout(timeout);
  }
};
