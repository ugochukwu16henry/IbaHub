import { desc, eq } from 'drizzle-orm';
import { isOwnerAdmin } from '@/lib/admin/auth';
import { toCsv } from '@/lib/admin/csv';
import { parseDateRange, inRange } from '@/lib/admin/date-range';
import { db } from '@/lib/db/drizzle';
import { payoutLedger, riderProfiles, users } from '@/lib/db/schema';
import { processDuePayouts } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await processDuePayouts();
  if (!(await isOwnerAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { from, to, fromRaw, toRaw } = parseDateRange(new URL(request.url).searchParams);

  const payouts = await db
    .select({
      id: payoutLedger.id,
      bookingId: payoutLedger.bookingId,
      amountNetKobo: payoutLedger.amountNetKobo,
      status: payoutLedger.status,
      transferReference: payoutLedger.transferReference,
      releaseAfterAt: payoutLedger.releaseAfterAt,
      createdAt: payoutLedger.createdAt,
      updatedAt: payoutLedger.updatedAt,
      riderName: users.name,
      riderEmail: users.email
    })
    .from(payoutLedger)
    .innerJoin(riderProfiles, eq(payoutLedger.riderProfileId, riderProfiles.id))
    .innerJoin(users, eq(riderProfiles.userId, users.id))
    .orderBy(desc(payoutLedger.createdAt));

  const filtered = payouts.filter((p) => inRange(p.createdAt, from, to));
  const csv = toCsv(
    [
      'id',
      'bookingId',
      'amountNetKobo',
      'status',
      'transferReference',
      'releaseAfterAt',
      'createdAt',
      'updatedAt',
      'riderName',
      'riderEmail'
    ],
    filtered.map((p) => [
      p.id,
      p.bookingId,
      p.amountNetKobo,
      p.status,
      p.transferReference || '',
      p.releaseAfterAt ? p.releaseAfterAt.toISOString() : '',
      p.createdAt.toISOString(),
      p.updatedAt.toISOString(),
      p.riderName || '',
      p.riderEmail
    ])
  );

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="payouts${fromRaw || toRaw ? `-${fromRaw || 'start'}-to-${toRaw || 'end'}` : ''}.csv"`
    }
  });
}

