export const INTEGRATION_SERVICES = [
  {
    id: 'logistics' as const,
    label: 'Logistics',
    description: 'Fleetbase & Mover — dispatch, delivery, tracking, booking.',
    envKey: 'INTEGRATION_LOGISTICS_URL'
  },
  {
    id: 'gig' as const,
    label: 'Gig / On-demand',
    description: 'Ride-hailing & gig matching (LibreTaxi, Uber-Clone flows).',
    envKey: 'INTEGRATION_GIG_URL'
  },
  {
    id: 'retail' as const,
    label: 'Retail & inventory',
    description: 'QUANTUM-STASH — catalog, POS, analytics, merchant tools.',
    envKey: 'INTEGRATION_RETAIL_URL'
  }
] as const;

export type IntegrationServiceId = (typeof INTEGRATION_SERVICES)[number]['id'];

export function getIntegrationBaseUrl(
  serviceId: IntegrationServiceId
): string | undefined {
  const map = {
    logistics: process.env.INTEGRATION_LOGISTICS_URL,
    gig: process.env.INTEGRATION_GIG_URL,
    retail: process.env.INTEGRATION_RETAIL_URL
  } as const;
  const raw = map[serviceId]?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, '');
}

export function getIntegrationHubSummary() {
  return INTEGRATION_SERVICES.map((s) => ({
    id: s.id,
    label: s.label,
    description: s.description,
    envKey: s.envKey,
    configured: Boolean(getIntegrationBaseUrl(s.id))
  }));
}
