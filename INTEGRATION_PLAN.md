# IbaHub Multi-Repo Integration Plan

## 1. Feature Mapping & Module Selection

- **fleetbase**: Core logistics engine (dispatch, fleet management, delivery tracking, order management, APIs)
- **libretaxi & Uber-Clone**: Ride-hailing, gig matching, driver/rider flows, real-time location, chat, payment integration
- **QUANTUM-STASH**: Inventory management, retail analytics, POS, product catalog, order management
- **saas-starter**: Next.js SaaS boilerplate, authentication, multi-tenancy, billing, user management
- **Mover**: Moving/logistics flows, booking, scheduling, pricing

## 2. Proposed Architecture

- **Microservices + Modular Monorepo**
  - Logistics Service: fleetbase, Mover
  - Gig/On-demand Service: libretaxi, Uber-Clone, Mover
  - Retail/Inventory Service: QUANTUM-STASH
  - Core SaaS Platform: saas-starter
- **API Gateway**: Unify APIs, handle auth, routing, and service discovery
- **Shared Auth & User Profiles**: Centralized user management (saas-starter), SSO across modules
- **Unified Frontend**: Next.js PWA (saas-starter as base), micro-frontends or modular pages for each domain
- **Database per service** (with shared user/identity DB)
- **Event-driven integration** (message bus/webhooks for cross-service actions)
- **Shared UI/Design System** for consistent UX

## 3. Step-by-Step Harmonization Plan

1. **Core Platform Setup**
   - Use saas-starter as the foundation: auth, multi-tenancy, billing, user management, design system
2. **Service Extraction & API Unification**
   - Extract APIs from all repos as standalone services
   - Standardize API contracts (REST/GraphQL)
   - Build an API Gateway
3. **User & Identity Unification**
   - Centralize user profiles, roles, and permissions in saas-starter
   - Implement SSO and shared session management
4. **Frontend Integration**
   - Use Next.js (saas-starter) as the main PWA shell
   - Integrate features as micro-frontends or modular pages/components
   - Import/refactor UI flows from other repos
5. **Logistics & Gig Workflows**
   - Integrate fleetbase’s logistics APIs
   - Merge gig-matching and ride-hailing logic from libretaxi/Uber-Clone/Mover
   - Harmonize booking, scheduling, and real-time tracking UIs
6. **Retail & Inventory Intelligence**
   - Integrate QUANTUM-STASH’s inventory, analytics, and merchant onboarding
   - Enable cross-service actions (e.g., gig workers delivering retail orders)
7. **Fintech & Payments**
   - Unify payment flows (wallet, payouts, merchant payments)
   - Integrate with local payment providers
8. **Testing, Security, and UX Unification**
   - Ensure consistent branding, navigation, and user experience
   - Implement end-to-end tests
   - Harden security

## 4. Integration Challenges & Recommendations

- Codebase Diversity: Use Docker and API-first integration to decouple
- Data Consistency: Use event-driven sync or API calls for cross-service data
- UX Consistency: Invest in a shared design system
- Performance: Use caching, CDN, and optimize API gateway
- Team Coordination: Modularize by domain, use clear API contracts, and CI/CD pipelines

## 5. Summary Table

| Domain        | Source Repo(s)        | Key Features to Integrate                 | Integration Approach        |
| ------------- | --------------------- | ----------------------------------------- | --------------------------- |
| Logistics     | fleetbase, Mover      | Dispatch, delivery, tracking, booking     | API-first, microservice     |
| Gig/On-demand | libretaxi, Uber-Clone | Ride-hailing, gig matching, chat, wallet  | API-first, refactor flows   |
| Retail        | QUANTUM-STASH         | Inventory, analytics, merchant onboarding | API-first, modular UI       |
| Core Platform | saas-starter          | Auth, billing, multi-tenancy, PWA shell   | Foundation, SSO, design sys |

## 6. Next Steps

1. Audit each repo for modularity and API readiness
2. Define service boundaries and API contracts
3. Set up the unified Next.js PWA shell
4. Incrementally integrate each domain as a service/module
5. Test, iterate, and refine UX and cross-service flows

## 7. Implementation alignment (living status)

The **saas-starter** app is the unified shell. In-dashboard views mirror this document:

| Plan section | In-app route | Code / notes |
| ------------ | ------------ | -------------- |
| §3 steps 1–8 | `/dashboard/hub/roadmap` | `lib/integration/harmonization.ts` |
| §5 domain matrix | same roadmap page (table) | `lib/integration/domain-matrix.ts` |
| §6.1 repo audit | `/dashboard/hub/audit` | `lib/integration/repo-audit.ts` |
| §3.2 API gateway | — | `/api/gateway/[service]/…`, session + tenant headers |
| §3.2 boundaries & contracts | roadmap page + API | `lib/integration/boundaries.ts`, `contracts/openapi/*.yaml`, `GET /api/integration/contracts`, `GET /api/integration/openapi/[service]` |
| §3.3 identity / tenants / SSO | `/dashboard/hub/tenants`, `/api/auth/sso/*` | `teams.integration_mappings`; OIDC + PKCE; `users.oauth_provider`, `users.oauth_sub` |
| §3.5–3.6 domain lists | `/dashboard/hub/data` | `INTEGRATION_*_LIST_PATH`, `lib/integration/domain-data.ts`; local logistics smoke: `pnpm mock:logistics` → `INTEGRATION_LOGISTICS_URL=http://localhost:4100` |
| §3.7 fintech / payouts | `/dashboard/hub/payments` | `lib/integration/payments-bridge.ts`; `POST /api/webhooks/payments/domain` |
| §3.8 security headers | — | `next.config.ts` `headers` (incl. CSP); `e2e/security-headers.spec.ts`, `e2e/integration-shell.spec.ts`; webhook rate limit + `Idempotency-Key` → `webhook_inbox` |
| Cross-service → activity | `/dashboard/activity` | Webhooks with `teamId` / `X-IbaHub-Team-Id`; `lib/integration/webhook-persist.ts`; team-scoped log |
| §3.4 modular UI | `/dashboard/hub`, `/dashboard/hub/slices/…` | Vertical slices per domain |
| §4 Docker / API-first | — | Run upstream repos with their own Docker; shell connects via `INTEGRATION_*_URL` |

**Source of truth:** this file at the repository root. Update §7 or the linked TypeScript modules when milestones change.

