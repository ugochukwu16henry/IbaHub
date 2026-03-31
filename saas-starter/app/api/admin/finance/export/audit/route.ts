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
  const rows: Array<Array<unknown>> = [];

  for (const q of data.audit.quarterly) {
    const periodDate = new Date(q.period);
    if (!from && !to || inRange(periodDate, from, to)) {
      rows.push(['quarterly', q.period, q.incomeKobo]);
    }
  }
  for (const a of data.audit.annual) {
    const periodDate = new Date(a.period);
    if (!from && !to || inRange(periodDate, from, to)) {
      rows.push(['annual', a.period, a.incomeKobo]);
    }
  }

  const csv = toCsv(['auditType', 'period', 'incomeKobo'], rows);
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="audit-quarterly-annual${fromRaw || toRaw ? `-${fromRaw || 'start'}-to-${toRaw || 'end'}` : ''}.csv"`
    }
  });
}

