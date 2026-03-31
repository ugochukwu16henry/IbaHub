import {
  getIntegrationBaseUrl,
  type IntegrationServiceId
} from '@/lib/integration/services';

/**
 * Optional hostname allowlists (INTEGRATION_LOGISTICS_ALLOWED_HOSTS, etc.):
 * comma-separated hostnames. If set, the configured base URL must match one
 * of them — INTEGRATION_PLAN.md §3.2 service boundaries.
 */
function allowedHostsEnvKey(service: IntegrationServiceId): string {
  const map = {
    logistics: 'INTEGRATION_LOGISTICS_ALLOWED_HOSTS',
    gig: 'INTEGRATION_GIG_ALLOWED_HOSTS',
    retail: 'INTEGRATION_RETAIL_ALLOWED_HOSTS'
  } as const;
  return map[service];
}

function parseAllowedHosts(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export type ValidatedBase =
  | { ok: true; base: string }
  | { ok: false; reason: 'not_configured' | 'invalid_base_url' | 'host_not_allowed' };

/**
 * Returns the upstream base URL only if optional hostname policy allows it.
 */
export function getValidatedIntegrationBaseUrl(
  service: IntegrationServiceId
): ValidatedBase {
  const base = getIntegrationBaseUrl(service);
  if (!base) {
    return { ok: false, reason: 'not_configured' };
  }

  const key = allowedHostsEnvKey(service);
  const allowed = parseAllowedHosts(process.env[key]);
  if (allowed.length === 0) {
    return { ok: true, base };
  }

  let hostname: string;
  try {
    hostname = new URL(base).hostname.toLowerCase();
  } catch {
    return { ok: false, reason: 'invalid_base_url' };
  }

  if (!allowed.includes(hostname)) {
    return { ok: false, reason: 'host_not_allowed' };
  }

  return { ok: true, base };
}
