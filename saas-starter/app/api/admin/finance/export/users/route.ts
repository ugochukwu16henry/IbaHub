import { isOwnerAdmin } from '@/lib/admin/auth';
import { getFinanceOverviewData } from '@/lib/admin/finance-data';
import { toCsv } from '@/lib/admin/csv';
import { parseDateRange, inRange } from '@/lib/admin/date-range';
import { processDuePayouts } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await processDuePayouts();
  if (!(await isOwnerAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { from, to, fromRaw, toRaw } = parseDateRange(new URL(request.url).searchParams);
  const data = await getFinanceOverviewData();
  const users = data.users.filter((u) => inRange(new Date(u.createdAt), from, to));
  const csv = toCsv(
    ['id', 'name', 'email', 'role', 'createdAt'],
    users.map((u) => [u.id, u.name || '', u.email, u.role, u.createdAt])
  );

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="users${fromRaw || toRaw ? `-${fromRaw || 'start'}-to-${toRaw || 'end'}` : ''}.csv"`
    }
  });
}

