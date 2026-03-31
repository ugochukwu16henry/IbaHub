import { INTEGRATION_ROUTE_TEMPLATES } from '@/lib/integration/contracts';
import { INTEGRATION_SERVICES } from '@/lib/integration/services';

/** Machine-readable boundary + route template manifest (INTEGRATION_PLAN §3.2). */
export function buildContractManifest() {
  return {
    version: '0.1.0',
    generatedAt: new Date().toISOString(),
    services: INTEGRATION_SERVICES.map((s) => ({
      id: s.id,
      label: s.label,
      sourceRepos: [...s.sourceRepos],
      planRefs: [...s.planRefs],
      routeTemplates: INTEGRATION_ROUTE_TEMPLATES[s.id],
      openapi: `/api/integration/openapi/${s.id}`
    }))
  };
}
