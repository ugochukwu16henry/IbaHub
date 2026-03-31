import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { payoutLedger } from '@/lib/db/schema';
import { releaseRiderPayoutById } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

async function isOwnerAdmin() {
  const user = await getUser();
  if (!user) return false;
  const team = await getTeamForUser();
  if (!team) return false;
  const member = team.teamMembers.find((m) => m.userId === user.id);
  return member?.role === 'owner';
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ payoutId: string }> }
) {
  const allowed = await isOwnerAdmin();
  if (!allowed) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { payoutId } = await context.params;
  const id = parseInt(payoutId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid payout id' }, { status: 400 });
  }

  const [payout] = await db
    .select()
    .from(payoutLedger)
    .where(eq(payoutLedger.id, id))
    .limit(1);
  if (!payout) return Response.json({ error: 'Payout not found' }, { status: 404 });

  const result = await releaseRiderPayoutById(id);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result);
}

