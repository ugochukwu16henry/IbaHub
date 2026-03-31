# Next.js SaaS Starter

This is a starter template for building a SaaS application using **Next.js** with support for authentication, Paystack-ready payments, and a dashboard for logged-in users.

**Demo: [https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) with NGN pricing and checkout action hooks
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management entry points routed through the payments hub
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [Paystack](https://paystack.com/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Getting Started

```bash
git clone https://github.com/nextjs/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

## Testing Payments

Use your Paystack test keys and test cards in the Paystack dashboard to validate charge/authorization behavior in your environment.

## Rider Marketplace + Dispatch

- Customer flow: choose nearest rider, pay upfront via Paystack, track status, confirm completion, then rate rider.
- Rider flow: go online, receive requests, start ride only after payment, mark done.
- Platform commission: 5% per rider booking (computed server-side).
- Payout readiness: after customer confirmation, payout is auto-released after `PAYOUT_DELAY_MINUTES` (default: 30).
- Background payout processing:
  - cron endpoint: `GET /api/cron/payouts/process`
  - secure with `CRON_SECRET` (sent as `Authorization: Bearer <CRON_SECRET>`).
  - Vercel cron schedule is configured in `vercel.json` (every 5 minutes).
- Core endpoints:
  - `GET /api/rides/nearest?pickupLat=..&pickupLng=..`
  - `POST /api/rides/bookings`
  - `POST /api/rides/bookings/:bookingId/pay`
  - `PATCH /api/rides/bookings/:bookingId/status`
  - `POST /api/rides/bookings/:bookingId/review`
  - `POST /api/webhooks/paystack`

## QUANTUM-STASH retail integration

- Retail owner page: `/dashboard/hub/slices/retail`
- Required env: `INTEGRATION_RETAIL_URL` (point this to your running QUANTUM-STASH backend).
- Wired endpoints:
  - `GET /api/products` or fallback `GET /api/inventory` (list products)
  - `POST /api/products` (create product)
  - `PUT /api/inventory/:id` (update quantity/stock)
- Billing gate: page management actions require active organization subscription.
- Billing tracking persisted from Paystack subscription webhooks:
  - `teams.subscription_renews_at`
  - `teams.last_paystack_payment_reference`

## Native retail parity (IbaHub)

- Full retail workspace routes:
  - `/dashboard/hub/retail`
  - `/dashboard/hub/retail/items`
  - `/dashboard/hub/retail/categories`
  - `/dashboard/hub/retail/brands`
  - `/dashboard/hub/retail/units`
  - `/dashboard/hub/retail/warehouses`
  - `/dashboard/hub/retail/orders`
  - `/dashboard/hub/retail/pos`
  - `/dashboard/hub/retail/inventory-adjustments`
- Native retail API (organization-scoped + active subscription gate):
  - `/api/retail/products` + `/api/retail/products/:id`
  - `/api/retail/inventory` + `/api/retail/inventory/:id`
  - `/api/retail/orders` + `/api/retail/orders/:id`
  - `/api/retail/pos` + `/api/retail/pos/:id`
  - `/api/retail/categories` + `/api/retail/categories/:id`
  - `/api/retail/brands` + `/api/retail/brands/:id`
  - `/api/retail/units` + `/api/retail/units/:id`
  - `/api/retail/warehouses` + `/api/retail/warehouses/:id`
  - `/api/retail/inventory-adjustments`
- New DB migration for native parity: `0012_retail_native_parity.sql`
- Onboarding flow:
  - `Create business profile` on `/dashboard/hub/retail`
  - Auto-creates default retail warehouse and starter units
  - `First product wizard` appears after active subscription and zero inventory
- Public storefront:
  - `/shops` lists public business shops
  - `/shops/:slug` shows products and lets buyers submit purchase requests
  - `/shops/:slug/products/:id` shows detailed product page (sizes, views, extra details)
  - Buyers can view business map location and contact owner via phone/WhatsApp
  - Buyers can request rider/truck delivery and jump to `/dashboard/rides/book`
  - Approved testimonials are displayed only after admin moderation
- Purchase flow:
  - Buyer submits purchase request with agreed payment terms (`upfront`, `on_delivery`, etc.)
  - Business owner reviews requests at `/dashboard/hub/retail/purchase-requests`
- Ratings & testimony flow:
  - Buyer submits a quick survey after `fulfilled` purchase (`professionalism`, `honesty`, `quality`, `communication`, `timeliness`)
  - Buyer and business owner can view review status in dashboard
  - Admin-only approval via `/dashboard/hub/payments/reviews`
  - Only approved reviews appear as storefront testimonials
- Product catalog customization:
  - Owners can add product images, variant rows (e.g. size/view), and arbitrary details
  - Storefront visibility is customizable per business via `/dashboard/hub/retail/storefront-settings`

- Business billing:
  - `Business` plan: **NGN 10,000/month** (upload products, prices, categories, public shop)
  - `Business + Inventory` plan: **NGN 25,000/month** (includes QUANTUM-STASH inventory suite)
- Card Number: `4242 4242 4242 4242`
- Expiration: Any future date
- CVC: Any 3-digit number

## Going to Production

When you're ready to deploy your SaaS application to production, follow these steps:

### Set up a production Paystack webhook

1. Go to the Paystack Dashboard and create a new webhook for your production environment.
2. Set the endpoint URL to your production API route (recommended: `https://yourdomain.com/api/webhooks/paystack`).
3. Select the events you want to listen for (for example, charge and subscription lifecycle events).

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Follow the Vercel deployment process, which will guide you through setting up your project.

### Add environment variables

In your Vercel project settings (or during deployment), add all the necessary environment variables. Make sure to update the values for the production environment, including:

1. `BASE_URL`: Set this to your production domain.
2. `PAYSTACK_SECRET_KEY`: Use your Paystack secret key for the production environment.
3. `PAYSTACK_WEBHOOK_SECRET`: Use the webhook secret from the production webhook you created in step 1.
4. `POSTGRES_URL`: Set this to your production database URL.
5. `AUTH_SECRET`: Set this to a random string. `openssl rand -base64 32` will generate one.

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
