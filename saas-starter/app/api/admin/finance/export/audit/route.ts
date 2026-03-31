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
  const rows: Array<Array<unknown>> = [];

  for (const q of data.audit.quarterly) {
    rows.push(['quarterly', q.period, q.incomeKobo]);
  }
  for (const a of data.audit.annual) {
    rows.push(['annual', a.period, a.incomeKobo]);
  }

  const csv = toCsv(['auditType', 'period', 'incomeKobo'], rows);
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="audit-quarterly-annual.csv"'
    }
  });
}

