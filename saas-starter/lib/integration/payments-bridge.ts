/**
 * INTEGRATION_PLAN.md §3.7 — Fintech & payments bridge.
 * Shell uses Stripe; domain services keep wallets/payouts until unified.
 */

export type ShellBillingInfo = {
  provider: 'stripe';
  pricingPath: string;
  teamSettingsPath: string;
};

export type DomainPaymentSlot = {
  id: 'logistics' | 'gig' | 'retail';
  label: string;
  /** Document-only: how you’ll flag payout mode per backend */
  modeEnvKey: string;
};

export const DOMAIN_PAYMENT_SLOTS: DomainPaymentSlot[] = [
  {
    id: 'logistics',
    label: 'Logistics / fleet payouts',
    modeEnvKey: 'INTEGRATION_LOGISTICS_PAYMENT_MODE'
  },
  {
    id: 'gig',
    label: 'Gig / driver wallet & payouts',
    modeEnvKey: 'INTEGRATION_GIG_PAYMENT_MODE'
  },
  {
    id: 'retail',
    label: 'Retail / merchant settlements',
    modeEnvKey: 'INTEGRATION_RETAIL_PAYMENT_MODE'
  }
];

export function getShellBilling(): ShellBillingInfo {
  return {
    provider: 'stripe',
    pricingPath: '/pricing',
    teamSettingsPath: '/dashboard'
  };
}
