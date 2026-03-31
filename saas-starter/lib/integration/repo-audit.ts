/**
 * INTEGRATION_PLAN.md §6.1 — Audit each repo for modularity and API readiness.
 * Checklist items are suggestions; complete them as you review each codebase.
 */

export type RepoAuditEntry = {
  folder: string;
  role: string;
  checks: string[];
};

export const REPO_AUDIT_CHECKLIST: RepoAuditEntry[] = [
  {
    folder: 'fleetbase',
    role: 'Logistics engine (§1)',
    checks: [
      'API base URL and auth model documented',
      'Dispatch/orders endpoints identified for gateway mapping',
      'Docker or local run documented'
    ]
  },
  {
    folder: 'Mover',
    role: 'Moving/logistics (§1)',
    checks: [
      'Ember app vs extractable API surface',
      'Booking flows that map to logistics domain'
    ]
  },
  {
    folder: 'libretaxi',
    role: 'Gig / ride-hailing (§1)',
    checks: [
      'Go entrypoints and external HTTP surface',
      'Telegram-centric vs HTTP API for hub integration'
    ]
  },
  {
    folder: 'Uber-Clone',
    role: 'Ride-hailing UI reference (§1)',
    checks: [
      'Next.js pages to port into shell vs proxy',
      'Mapbox/env vars for tracking'
    ]
  },
  {
    folder:
      'QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind',
    role: 'Retail / inventory (§1)',
    checks: [
      'API routes or server actions for catalog/inventory',
      'Auth model vs IbaHub SSO (replace or federate)'
    ]
  },
  {
    folder: 'saas-starter',
    role: 'Core platform (§5)',
    checks: [
      'POSTGRES_URL and migrations applied',
      'INTEGRATION_*_URL pointed at dev upstreams',
      'Gateway headers accepted by downstream stubs'
    ]
  }
];
