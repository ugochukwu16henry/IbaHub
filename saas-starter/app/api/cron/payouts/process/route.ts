import { NextRequest, NextResponse } from 'next/server';
import { processDuePayouts } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get('authorization')?.trim();
  if (auth === `Bearer ${secret}`) return true;

  const cronHeader = request.headers.get('x-cron-secret')?.trim();
  return cronHeader === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const processed = await processDuePayouts();
  return NextResponse.json({ ok: true, processed });
}

