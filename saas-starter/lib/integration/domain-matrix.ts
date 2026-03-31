/**
 * Mirrors INTEGRATION_PLAN.md §5 Summary Table.
 */

export type DomainMatrixRow = {
  domain: string;
  sourceRepos: string[];
  keyFeatures: string;
  approach: string;
  /** Integration hub service id when applicable */
  serviceId?: 'logistics' | 'gig' | 'retail';
  /** Local repo folder names under IbaHub (for audit) */
  repoFolders: string[];
};

export const DOMAIN_MATRIX: DomainMatrixRow[] = [
  {
    domain: 'Logistics',
    sourceRepos: ['fleetbase', 'Mover'],
    keyFeatures:
      'Dispatch, delivery, tracking, booking',
    approach: 'API-first, microservice',
    serviceId: 'logistics',
    repoFolders: ['fleetbase', 'Mover']
  },
  {
    domain: 'Gig / On-demand',
    sourceRepos: ['libretaxi', 'Uber-Clone'],
    keyFeatures:
      'Ride-hailing, gig matching, chat, wallet',
    approach: 'API-first, refactor flows',
    serviceId: 'gig',
    repoFolders: ['libretaxi', 'Uber-Clone']
  },
  {
    domain: 'Retail',
    sourceRepos: ['QUANTUM-STASH'],
    keyFeatures:
      'Inventory, analytics, merchant onboarding',
    approach: 'API-first, modular UI',
    serviceId: 'retail',
    repoFolders: ['QUANTUM-STASH-inventory-Management-SaaS-NextJs-TypeScript-NextAuth-v5-Postgres-Drizzle-Tailwind']
  },
  {
    domain: 'Core Platform',
    sourceRepos: ['saas-starter'],
    keyFeatures:
      'Auth, billing, multi-tenancy, PWA shell',
    approach: 'Foundation, SSO, design system',
    repoFolders: ['saas-starter']
  }
];
