import type { IntegrationServiceId } from '@/lib/integration/services';

/** Build a same-origin gateway path (for use with `fetch` in the browser). */
export function integrationGatewayPath(
  service: IntegrationServiceId,
  ...segments: string[]
): string {
  const encoded = segments.map((s) => encodeURIComponent(s)).join('/');
  const suffix = encoded.length > 0 ? `/${encoded}` : '';
  return `/api/gateway/${service}${suffix}`;
}

/**
 * Suggested URL segments per domain. Replace with real OpenAPI paths as each
 * backend is connected.
 */
export const INTEGRATION_ROUTE_TEMPLATES = {
  logistics: {
    health: ['health'] as const,
    /** Example: dispatch list */
    orders: ['v1', 'orders'] as const
  },
  gig: {
    health: ['health'] as const,
    rides: ['v1', 'rides'] as const
  },
  retail: {
    health: ['health'] as const,
    products: ['api', 'products'] as const
  }
} as const satisfies Record<
  IntegrationServiceId,
  Record<string, readonly string[]>
>;
