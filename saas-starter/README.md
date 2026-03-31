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
