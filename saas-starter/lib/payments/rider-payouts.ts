import { and, eq, lte } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { payoutLedger, riderProfiles } from '@/lib/db/schema';
import {
  createPaystackTransferRecipient,
  initiatePaystackTransfer
} from './paystack-marketplace';

export async function releaseRiderPayoutById(payoutId: number) {
  const [payout] = await db
    .select()
    .from(payoutLedger)
    .where(eq(payoutLedger.id, payoutId))
    .limit(1);
  if (!payout) {
    return { ok: false as const, status: 404, error: 'Payout not found' };
  }
  if (payout.status === 'pending_delay') {
    return {
      ok: false as const,
      status: 409,
      error: 'Payout delay window has not elapsed yet'
    };
  }
  if (payout.status !== 'ready_for_payout') {
    return {
      ok: false as const,
      status: 409,
      error: `Payout is ${payout.status}, not ready_for_payout`
    };
  }

  const [rider] = await db
    .select()
    .from(riderProfiles)
    .where(eq(riderProfiles.id, payout.riderProfileId))
    .limit(1);
  if (!rider) {
    return { ok: false as const, status: 404, error: 'Rider profile not found' };
  }

  const bankCode = rider.bankCode?.trim();
  const accountNumber = rider.accountNumber?.trim();
  const accountName = rider.accountName?.trim() || `Rider ${rider.id}`;
  if (!bankCode || !accountNumber) {
    return {
      ok: false as const,
      status: 400,
      error: 'Rider bank details are missing'
    };
  }

  let recipientCode = rider.paystackRecipientCode || null;
  if (!recipientCode) {
    recipientCode = await createPaystackTransferRecipient({
      accountNumber,
      bankCode,
      name: accountName
    });
    await db
      .update(riderProfiles)
      .set({
        paystackRecipientCode: recipientCode,
        accountName,
        updatedAt: new Date()
      })
      .where(eq(riderProfiles.id, rider.id));
  }

  const transferReference = `payout_${payout.id}_${Date.now()}`;
  try {
    const paystackRef = await initiatePaystackTransfer({
      amountKobo: payout.amountNetKobo,
      recipientCode,
      reason: `Rider payout for booking ${payout.bookingId}`,
      reference: transferReference
    });

    await db
      .update(payoutLedger)
      .set({
        status: 'processing',
        transferReference: paystackRef,
        updatedAt: new Date()
      })
      .where(eq(payoutLedger.id, payout.id));

    return {
      ok: true as const,
      payoutId: payout.id,
      transferReference: paystackRef,
      status: 'processing'
    };
  } catch (error) {
    await db
      .update(payoutLedger)
      .set({
        status: 'failed',
        transferReference,
        updatedAt: new Date()
      })
      .where(eq(payoutLedger.id, payout.id));

    return {
      ok: false as const,
      status: 502,
      error: error instanceof Error ? error.message : 'Payout failed'
    };
  }
}

export async function getPayoutByBookingId(bookingId: number) {
  const [payout] = await db
    .select()
    .from(payoutLedger)
    .where(eq(payoutLedger.bookingId, bookingId))
    .limit(1);
  return payout || null;
}

export async function processDuePayouts() {
  const due = await db
    .select()
    .from(payoutLedger)
    .where(
      and(
        eq(payoutLedger.status, 'pending_delay'),
        lte(payoutLedger.releaseAfterAt, new Date())
      )
    );

  for (const payout of due) {
    await db
      .update(payoutLedger)
      .set({ status: 'ready_for_payout', updatedAt: new Date() })
      .where(eq(payoutLedger.id, payout.id));

    await releaseRiderPayoutById(payout.id);
  }

  return due.length;
}
