import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { payoutLedger, riderBookings, serviceRequests, teams } from '@/lib/db/schema';
import { verifyPaystackSignature } from '@/lib/payments/paystack-marketplace';
import { getPlanByPriceId } from '@/lib/payments/plans';

type PaystackChargeEvent = {
  event: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    paid_at?: string;
    paidAt?: string;
    metadata?: {
      kind?: string;
      serviceRequestId?: number;
      riderBookingId?: number;
      teamId?: number;
      priceId?: string;
      planName?: string;
      [key: string]: unknown;
    };
  };
};

function getRenewalDate(
  paidAtRaw: string | undefined,
  interval: string | undefined
): Date {
  const base = paidAtRaw ? new Date(paidAtRaw) : new Date();
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
  const renews = new Date(safeBase);

  if (interval === 'year') {
    renews.setFullYear(renews.getFullYear() + 1);
  } else {
    renews.setMonth(renews.getMonth() + 1);
  }

  return renews;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: PaystackChargeEvent;
  try {
    payload = JSON.parse(rawBody) as PaystackChargeEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (payload.event !== 'charge.success') {
    if (
      (payload.event === 'transfer.success' || payload.event === 'transfer.failed') &&
      payload.data?.reference
    ) {
      const nextStatus = payload.event === 'transfer.success' ? 'paid' : 'failed';
      await db
        .update(payoutLedger)
        .set({
          status: nextStatus,
          updatedAt: new Date()
        })
        .where(eq(payoutLedger.transferReference, payload.data.reference));
      return NextResponse.json({ ok: true, transferStatusUpdated: nextStatus });
    }
    return NextResponse.json({ ok: true, ignored: payload.event ?? 'unknown' });
  }

  const reference = payload.data?.reference;
  const amount = payload.data?.amount;
  const kind = payload.data?.metadata?.kind;
  const serviceRequestId = payload.data?.metadata?.serviceRequestId;
  const riderBookingId = payload.data?.metadata?.riderBookingId;
  const teamId = payload.data?.metadata?.teamId;
  const priceId = payload.data?.metadata?.priceId;
  if (!reference || !amount) {
    return NextResponse.json({ error: 'Missing required payment metadata' }, { status: 400 });
  }

  if (kind === 'rider_booking' && riderBookingId) {
    const [booking] = await db
      .select()
      .from(riderBookings)
      .where(eq(riderBookings.id, Number(riderBookingId)))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: 'Rider booking not found' }, { status: 404 });
    }
    if (booking.paymentStatus === 'paid') {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }
    if (booking.grossAmountKobo !== amount) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    await db
      .update(riderBookings)
      .set({
        paymentStatus: 'paid',
        paidAt: new Date(),
        paystackReference: reference,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(riderBookings.id, Number(riderBookingId)),
          eq(riderBookings.paymentStatus, 'unpaid')
        )
      );

    return NextResponse.json({ ok: true });
  }

  if (kind === 'team_subscription' && teamId && priceId) {
    const selected = getPlanByPriceId(String(priceId));
    if (!selected) {
      return NextResponse.json({ error: 'Unknown plan price' }, { status: 400 });
    }
    if (selected.price.unitAmount !== amount) {
      return NextResponse.json({ error: 'Amount mismatch for plan' }, { status: 400 });
    }

    const [team] = await db.select().from(teams).where(eq(teams.id, Number(teamId))).limit(1);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const paidAtRaw = payload.data?.paid_at || payload.data?.paidAt;
    const renewsAt = getRenewalDate(paidAtRaw, selected.price.interval);

    await db
      .update(teams)
      .set({
        planName: selected.product.name,
        subscriptionStatus: 'active',
        subscriptionRenewsAt: renewsAt,
        lastPaystackPaymentReference: reference,
        updatedAt: new Date()
      })
      .where(eq(teams.id, Number(teamId)));

    return NextResponse.json({ ok: true });
  }

  if (!serviceRequestId) {
    return NextResponse.json({ error: 'Unknown payment metadata kind' }, { status: 400 });
  }

  const [requestRow] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, Number(serviceRequestId)))
    .limit(1);

  if (!requestRow) {
    return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
  }

  if (requestRow.paymentStatus === 'paid') {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  if (requestRow.grossAmountKobo !== amount) {
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  await db
    .update(serviceRequests)
    .set({
      paymentStatus: 'paid',
      paidAt: new Date(),
      paystackReference: reference,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(serviceRequests.id, Number(serviceRequestId)),
        eq(serviceRequests.paymentStatus, 'unpaid')
      )
    );

  return NextResponse.json({ ok: true });
}
