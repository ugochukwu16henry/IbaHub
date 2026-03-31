import { isOwnerAdmin } from '@/lib/admin/auth';
import { getFinanceOverviewData } from '@/lib/admin/finance-data';
import { toCsv } from '@/lib/admin/csv';
import { parseDateRange } from '@/lib/admin/date-range';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { payoutLedger, riderBookings } from '@/lib/db/schema';
import { processDuePayouts } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await processDuePayouts();
  if (!(await isOwnerAdmin())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { from, to, fromRaw, toRaw } = parseDateRange(new URL(request.url).searchParams);

  if (!from || !to) {
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

  const incomeRows = await db
    .select({
      total: sql<number>`coalesce(sum(${riderBookings.grossAmountKobo}), 0)`
    })
    .from(riderBookings)
    .where(
      and(
        eq(riderBookings.paymentStatus, 'paid'),
        gte(riderBookings.paidAt, from),
        lte(riderBookings.paidAt, to)
      )
    );

  const expenseRows = await db
    .select({
      total: sql<number>`coalesce(sum(${payoutLedger.amountNetKobo}), 0)`
    })
    .from(payoutLedger)
    .where(
      and(
        eq(payoutLedger.status, 'paid'),
        gte(payoutLedger.updatedAt, from),
        lte(payoutLedger.updatedAt, to)
      )
    );

  const income = Number(incomeRows[0]?.total ?? 0);
  const expenses = Number(expenseRows[0]?.total ?? 0);
  const csv = toCsv(
    ['period', 'from', 'to', 'incomeKobo', 'expensesKobo', 'netKobo'],
    [['custom', from.toISOString(), to.toISOString(), income, expenses, income - expenses]]
  );

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="pnl-${fromRaw}-to-${toRaw}.csv"`
    }
  });
}

