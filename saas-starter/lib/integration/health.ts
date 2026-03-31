import {
  getIntegrationBaseUrl,
  type IntegrationServiceId
} from '@/lib/integration/services';

const DEFAULT_HEALTH_PATH = '/health';
const TIMEOUT_MS = 4000;

function healthPathFor(serviceId: IntegrationServiceId): string {
  const envMap = {
    logistics: process.env.INTEGRATION_LOGISTICS_HEALTH_PATH,
    gig: process.env.INTEGRATION_GIG_HEALTH_PATH,
    retail: process.env.INTEGRATION_RETAIL_HEALTH_PATH
  } as const;
  const raw = envMap[serviceId]?.trim();
  if (!raw) return DEFAULT_HEALTH_PATH;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export type IntegrationHealthResult = {
  id: IntegrationServiceId;
  configured: boolean;
  ok: boolean;
  status?: number;
  latencyMs: number;
  checkedUrl?: string;
  error?: string;
};

export async function checkIntegrationHealth(
  serviceId: IntegrationServiceId
): Promise<IntegrationHealthResult> {
  const base = getIntegrationBaseUrl(serviceId);
  if (!base) {
    return {
      id: serviceId,
      configured: false,
      ok: false,
      latencyMs: 0
    };
  }

  const path = healthPathFor(serviceId);
  const url = `${base}${path}`;
  const started = performance.now();

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { accept: 'application/json, text/plain, */*' }
    });
    clearTimeout(id);
    const latencyMs = Math.round(performance.now() - started);
    return {
      id: serviceId,
      configured: true,
      ok: res.ok,
      status: res.status,
      latencyMs,
      checkedUrl: url
    };
  } catch (e) {
    const latencyMs = Math.round(performance.now() - started);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return {
      id: serviceId,
      configured: true,
      ok: false,
      latencyMs,
      checkedUrl: url,
      error: message
    };
  }
}

export async function checkAllIntegrationHealth(): Promise<
  IntegrationHealthResult[]
> {
  const ids: IntegrationServiceId[] = ['logistics', 'gig', 'retail'];
  return Promise.all(ids.map((id) => checkIntegrationHealth(id)));
}
