import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

type LocalPrice = {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  interval: string;
  trialPeriodDays: number;
};

type LocalProduct = {
  id: string;
  name: string;
  description: string;
  defaultPriceId: string;
};

const LOCAL_PRICES: LocalPrice[] = [
  {
    id: 'base-local',
    productId: 'base-local-product',
    unitAmount: 800000,
    currency: 'ngn',
    interval: 'month',
    trialPeriodDays: 7
  },
  {
    id: 'plus-local',
    productId: 'plus-local-product',
    unitAmount: 1200000,
    currency: 'ngn',
    interval: 'month',
    trialPeriodDays: 7
  }
];

const LOCAL_PRODUCTS: LocalProduct[] = [
  {
    id: 'base-local-product',
    name: 'Base',
    description: 'Base subscription plan',
    defaultPriceId: 'base-local'
  },
  {
    id: 'plus-local-product',
    name: 'Plus',
    description: 'Plus subscription plan',
    defaultPriceId: 'plus-local'
  }
];

export async function createCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  // TODO: Initialize a Paystack transaction and redirect to authorization_url.
  redirect('/dashboard/hub/payments');
}

export async function createCustomerPortalSession(_: Team) {
  // TODO: Link to Paystack subscription management once available.
  return {
    url: '/dashboard/hub/payments'
  };
}

export async function getPaystackPrices() {
  return LOCAL_PRICES;
}

export async function getPaystackProducts() {
  return LOCAL_PRODUCTS;
}
