import { isOwnerAdmin } from '@/lib/admin/auth';
import { getFinanceOverviewData } from '@/lib/admin/finance-data';
import { toCsv } from '@/lib/admin/csv';
import { processDuePayouts } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

export async function GET() {
  await processDuePayouts();
  if (!(await isOwnerAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await getFinanceOverviewData();
  const m = data.periods.monthly;
  const csv = toCsv(
    ['period', 'incomeKobo', 'expensesKobo', 'netKobo'],
    [['monthly', m.incomeKobo, m.expensesKobo, m.netKobo]]
  );

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="pnl-monthly.csv"'
    }
  });
}

