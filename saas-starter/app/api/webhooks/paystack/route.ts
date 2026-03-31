import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { serviceRequests } from '@/lib/db/schema';
import { verifyPaystackSignature } from '@/lib/payments/paystack-marketplace';

type PaystackChargeEvent = {
  event: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    metadata?: {
      serviceRequestId?: number;
      [key: string]: unknown;
    };
  };
};

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
    return NextResponse.json({ ok: true, ignored: payload.event ?? 'unknown' });
  }

  const reference = payload.data?.reference;
  const amount = payload.data?.amount;
  const serviceRequestId = payload.data?.metadata?.serviceRequestId;
  if (!reference || !amount || !serviceRequestId) {
    return NextResponse.json({ error: 'Missing required payment metadata' }, { status: 400 });
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
