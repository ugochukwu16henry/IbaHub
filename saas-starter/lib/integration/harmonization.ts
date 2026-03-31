/**
 * Mirrors INTEGRATION_PLAN.md §3 Step-by-Step Harmonization Plan (steps 1–8).
 * Titles and bullets match the plan document; status tracks implementation.
 */

export type HarmonizationStatus = 'planned' | 'partial' | 'done';

export type HarmonizationStep = {
  step: number;
  title: string;
  bullets: string[];
  status: HarmonizationStatus;
  /** Where this shows up in the app or codebase */
  implementationHint?: string;
};

export const HARMONIZATION_STEPS: HarmonizationStep[] = [
  {
    step: 1,
    title: 'Core Platform Setup',
    bullets: [
      'Use saas-starter as the foundation: auth, multi-tenancy, billing, user management, design system'
    ],
    status: 'partial',
    implementationHint:
      'saas-starter: auth, teams, Stripe, dashboard; PWA manifest; design system via shared UI components.'
  },
  {
    step: 2,
    title: 'Service Extraction & API Unification',
    bullets: [
      'Extract APIs from all repos as standalone services',
      'Standardize API contracts (REST/GraphQL)',
      'Build an API Gateway'
    ],
    status: 'partial',
    implementationHint:
      'Gateway: /api/gateway/[service]/…; route templates: lib/integration/contracts.ts; optional hostname allowlists: lib/integration/boundaries.ts; OpenAPI stubs: contracts/openapi/*.yaml; discovery: GET /api/integration/contracts, GET /api/integration/openapi/[service].'
  },
  {
    step: 3,
    title: 'User & Identity Unification',
    bullets: [
      'Centralize user profiles, roles, and permissions in saas-starter',
      'Implement SSO and shared session management'
    ],
    status: 'partial',
    implementationHint:
      'Users/teams in Postgres; tenant mapping: /dashboard/hub/tenants; OIDC SSO (PKCE): /api/auth/sso/start → callback, users.oauth_* columns; enable with AUTH_SSO_* and NEXT_PUBLIC_AUTH_SSO_ENABLED=true.'
  },
  {
    step: 4,
    title: 'Frontend Integration',
    bullets: [
      'Use Next.js (saas-starter) as the main PWA shell',
      'Integrate features as micro-frontends or modular pages/components',
      'Import/refactor UI flows from other repos'
    ],
    status: 'partial',
    implementationHint:
      'Modular hub routes, vertical slices under /dashboard/hub/slices/*, domain list endpoints under /dashboard/hub/data/*; embed or iframe other UIs later.'
  },
  {
    step: 5,
    title: 'Logistics & Gig Workflows',
    bullets: [
      'Integrate fleetbase’s logistics APIs',
      'Merge gig-matching and ride-hailing logic from libretaxi/Uber-Clone/Mover',
      'Harmonize booking, scheduling, and real-time tracking UIs'
    ],
    status: 'partial',
    implementationHint:
      'Slices: /dashboard/hub/slices/*; list data: /dashboard/hub/data/* (INTEGRATION_*_LIST_PATH). Local logistics + gig: pnpm mock:domains (or mock:logistics / mock:gig) + INTEGRATION_*_URL on 4100/4200 → health + gateway.'
  },
  {
    step: 6,
    title: 'Retail & Inventory Intelligence',
    bullets: [
      'Integrate QUANTUM-STASH’s inventory, analytics, and merchant onboarding',
      'Enable cross-service actions (e.g., gig workers delivering retail orders)'
    ],
    status: 'partial',
    implementationHint:
      'Retail slice: /dashboard/hub/slices/retail; webhooks with teamId (or X-IbaHub-Team-Id) persist to team activity; disable with INTEGRATION_WEBHOOK_PERSIST_ACTIVITY=false. Local catalog mock: pnpm mock:retail + INTEGRATION_RETAIL_URL=http://localhost:4300 → /dashboard/hub/data/retail.'
  },
  {
    step: 7,
    title: 'Fintech & Payments',
    bullets: [
      'Unify payment flows (wallet, payouts, merchant payments)',
      'Integrate with local payment providers'
    ],
    status: 'partial',
    implementationHint:
      'Hub: /dashboard/hub/payments; lib/integration/payments-bridge.ts; domain payout webhook POST /api/webhooks/payments/domain (INTEGRATION_PAYMENTS_WEBHOOK_SECRET); optional INTEGRATION_*_PAYMENT_MODE per backend.'
  },
  {
    step: 8,
    title: 'Testing, Security, and UX Unification',
    bullets: [
      'Ensure consistent branding, navigation, and user experience',
      'Implement end-to-end tests',
      'Harden security'
    ],
    status: 'partial',
    implementationHint:
      'e2e: pnpm test:e2e (smoke + security-headers + integration-shell); next.config.ts CSP + security headers; gateway auth + webhook secrets; webhook POST rate limit (WEBHOOK_RATE_LIMIT_PER_MINUTE) + Idempotency-Key → webhook_inbox dedupe; rotate credentials if exposed.'
  }
];

export const PLAN_NEXT_STEPS = [
  'Audit each repo for modularity and API readiness',
  'Define service boundaries and API contracts',
  'Set up the unified Next.js PWA shell',
  'Incrementally integrate each domain as a service/module',
  'Test, iterate, and refine UX and cross-service flows'
] as const;
