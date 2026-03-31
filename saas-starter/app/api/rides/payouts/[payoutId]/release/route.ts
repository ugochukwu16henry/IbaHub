import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { payoutLedger, riderProfiles } from '@/lib/db/schema';
import { releaseRiderPayoutById } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  context: { params: Promise<{ payoutId: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { payoutId } = await context.params;
  const id = parseInt(payoutId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid payout id' }, { status: 400 });
  }

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
        eq(payoutLedger.id, id),
        eq(payoutLedger.riderProfileId, rider.id),
        eq(payoutLedger.status, 'ready_for_payout')
      )
    )
    .limit(1);
  if (!payout) return Response.json({ error: 'Payout not available' }, { status: 404 });

  const result = await releaseRiderPayoutById(payout.id);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result);
}

