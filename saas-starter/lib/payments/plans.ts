export type LocalPrice = {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  interval: string;
  trialPeriodDays: number;
};

export type LocalProduct = {
  id: string;
  name: string;
  description: string;
  defaultPriceId: string;
};

export const LOCAL_PRICES: LocalPrice[] = [
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

export const LOCAL_PRODUCTS: LocalProduct[] = [
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

export function getPlanByPriceId(priceId: string) {
  const price = LOCAL_PRICES.find((p) => p.id === priceId);
  if (!price) return null;
  const product = LOCAL_PRODUCTS.find((p) => p.id === price.productId);
  if (!product) return null;
  return { price, product };
}
