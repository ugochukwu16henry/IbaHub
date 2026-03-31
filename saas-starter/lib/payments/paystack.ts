import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { initializePaystackTransaction } from './paystack-marketplace';
import { LOCAL_PRICES, LOCAL_PRODUCTS, getPlanByPriceId } from './plans';

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

  const selected = getPlanByPriceId(priceId);
  if (!selected) {
    throw new Error('Invalid subscription plan selected');
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const reference = `sub_${team.id}_${Date.now()}`;
  const tx = await initializePaystackTransaction({
    email: user.email,
    amountKobo: selected.price.unitAmount,
    reference,
    callbackUrl: `${baseUrl}/dashboard?payment=subscription_callback`,
    metadata: {
      kind: 'team_subscription',
      teamId: team.id,
      userId: user.id,
      priceId: selected.price.id,
      planName: selected.product.name
    }
  });

  redirect(tx.authorization_url);
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
