import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { payoutLedger, riderProfiles } from '@/lib/db/schema';
import { processDuePayouts } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

export async function GET() {
  await processDuePayouts();
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [rider] = await db
    .select()
    .from(riderProfiles)
    .where(eq(riderProfiles.userId, user.id))
    .limit(1);
  if (!rider) return Response.json({ error: 'Rider profile not found' }, { status: 404 });

  const payouts = await db
    .select()
    .from(payoutLedger)
    .where(eq(payoutLedger.riderProfileId, rider.id))
    .orderBy(desc(payoutLedger.createdAt));

  return Response.json({ payouts });
}

export async function POST() {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [rider] = await db
    .select()
    .from(riderProfiles)
    .where(eq(riderProfiles.userId, user.id))
    .limit(1);
  if (!rider) return Response.json({ error: 'Rider profile not found' }, { status: 404 });

  const [payout] = await db
    .select()
    .from(payoutLedger)
    .where(
      and(
        eq(payoutLedger.riderProfileId, rider.id),
        eq(payoutLedger.status, 'ready_for_payout')
      )
    )
    .orderBy(desc(payoutLedger.createdAt))
    .limit(1);

  if (!payout) {
    return Response.json({ error: 'No payout ready for release' }, { status: 404 });
  }

  return Response.json({ payout });
}

