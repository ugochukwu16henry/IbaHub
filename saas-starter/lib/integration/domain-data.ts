import type { IntegrationServiceId } from '@/lib/integration/services';

/**
 * Primary “list” resource per domain (beyond health). Override with env when
 * upstream routes differ (e.g. Fleetbase fleetops paths).
 */
const DEFAULT_LIST_PATH: Record<IntegrationServiceId, string> = {
  logistics: 'v1/orders',
  gig: 'v1/rides',
  retail: 'api/products'
};

const ENV_LIST_PATH: Record<IntegrationServiceId, string | undefined> = {
  logistics: process.env.INTEGRATION_LOGISTICS_LIST_PATH,
  gig: process.env.INTEGRATION_GIG_LIST_PATH,
  retail: process.env.INTEGRATION_RETAIL_LIST_PATH
};

export function getDomainListPath(service: IntegrationServiceId): string {
  const raw = ENV_LIST_PATH[service]?.trim();
  if (raw) return raw.replace(/^\//, '');
  return DEFAULT_LIST_PATH[service];
}

export const DOMAIN_DATA_LABELS: Record<
  IntegrationServiceId,
  { title: string; planRef: string }
> = {
  logistics: {
    title: 'Logistics data',
    planRef: '§3.5 — fleetbase / Mover orders or dispatch list'
  },
  gig: {
    title: 'Gig data',
    planRef: '§3.5 — ride / gig list (libretaxi / Uber-Clone backends)'
  },
  retail: {
    title: 'Retail data',
    planRef: '§3.6 — QUANTUM-STASH products / inventory list'
  }
};
