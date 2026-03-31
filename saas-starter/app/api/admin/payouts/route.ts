import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { payoutLedger, riderProfiles, users } from '@/lib/db/schema';
import { processDuePayouts } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

async function isOwnerAdmin() {
  const user = await getUser();
  if (!user) return false;
  const team = await getTeamForUser();
  if (!team) return false;
  const member = team.teamMembers.find((m) => m.userId === user.id);
  return member?.role === 'owner';
}

export async function GET() {
  await processDuePayouts();
  const allowed = await isOwnerAdmin();
  if (!allowed) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payouts = await db
    .select({
      id: payoutLedger.id,
      bookingId: payoutLedger.bookingId,
      amountNetKobo: payoutLedger.amountNetKobo,
      status: payoutLedger.status,
      transferReference: payoutLedger.transferReference,
      createdAt: payoutLedger.createdAt,
      riderId: riderProfiles.id,
      riderName: users.name,
      riderEmail: users.email
    })
    .from(payoutLedger)
    .innerJoin(riderProfiles, eq(payoutLedger.riderProfileId, riderProfiles.id))
    .innerJoin(users, eq(riderProfiles.userId, users.id))
    .orderBy(desc(payoutLedger.createdAt));

  return Response.json({ payouts });
}

