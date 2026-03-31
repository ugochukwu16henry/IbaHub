export const PLATFORM_COMMISSION_RATE = 0.05;

export function fareWithCommission(quotedFareKobo: number) {
  const grossAmountKobo = quotedFareKobo;
  const platformFeeKobo = Math.round(grossAmountKobo * PLATFORM_COMMISSION_RATE);
  const riderNetKobo = Math.max(grossAmountKobo - platformFeeKobo, 0);
  return { grossAmountKobo, platformFeeKobo, riderNetKobo };
}
