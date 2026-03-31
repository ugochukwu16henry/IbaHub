import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { payoutLedger, riderBookings, users } from '@/lib/db/schema';

async function sumAmountKobo(tableExpr: any, amountExpr: any, whereExpr?: any) {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${amountExpr}), 0)` })
    .from(tableExpr)
    .where(whereExpr ?? sql`true`);
  return Number(rows[0]?.total ?? 0);
}

export async function getFinanceOverviewData() {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);

  const incomeTotal = await sumAmountKobo(
    riderBookings,
    riderBookings.grossAmountKobo,
    eq(riderBookings.paymentStatus, 'paid')
  );
  const paidOutTotal = await sumAmountKobo(
    payoutLedger,
    payoutLedger.amountNetKobo,
    eq(payoutLedger.status, 'paid')
  );
  const outstandingPayouts = await sumAmountKobo(
    payoutLedger,
    payoutLedger.amountNetKobo,
    sql`${payoutLedger.status} in ('ready_for_payout', 'pending_delay', 'processing')`
  );

  const incomeDaily = await sumAmountKobo(
    riderBookings,
    riderBookings.grossAmountKobo,
    and(eq(riderBookings.paymentStatus, 'paid'), sql`${riderBookings.paidAt} >= ${dayStart}`)
  );
  const incomeMonthly = await sumAmountKobo(
    riderBookings,
    riderBookings.grossAmountKobo,
    and(eq(riderBookings.paymentStatus, 'paid'), sql`${riderBookings.paidAt} >= ${monthStart}`)
  );
  const incomeQuarterly = await sumAmountKobo(
    riderBookings,
    riderBookings.grossAmountKobo,
    and(eq(riderBookings.paymentStatus, 'paid'), sql`${riderBookings.paidAt} >= ${quarterStart}`)
  );
  const incomeAnnually = await sumAmountKobo(
    riderBookings,
    riderBookings.grossAmountKobo,
    and(eq(riderBookings.paymentStatus, 'paid'), sql`${riderBookings.paidAt} >= ${yearStart}`)
  );

  const expensesDaily = await sumAmountKobo(
    payoutLedger,
    payoutLedger.amountNetKobo,
    and(eq(payoutLedger.status, 'paid'), sql`${payoutLedger.updatedAt} >= ${dayStart}`)
  );
  const expensesMonthly = await sumAmountKobo(
    payoutLedger,
    payoutLedger.amountNetKobo,
    and(eq(payoutLedger.status, 'paid'), sql`${payoutLedger.updatedAt} >= ${monthStart}`)
  );
  const expensesQuarterly = await sumAmountKobo(
    payoutLedger,
    payoutLedger.amountNetKobo,
    and(eq(payoutLedger.status, 'paid'), sql`${payoutLedger.updatedAt} >= ${quarterStart}`)
  );
  const expensesAnnually = await sumAmountKobo(
    payoutLedger,
    payoutLedger.amountNetKobo,
    and(eq(payoutLedger.status, 'paid'), sql`${payoutLedger.updatedAt} >= ${yearStart}`)
  );

  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt))
    .limit(500);

  const quarterlyAudit = await db
    .select({
      period: sql<string>`date_trunc('quarter', ${riderBookings.paidAt})::text`,
      incomeKobo: sql<number>`coalesce(sum(${riderBookings.grossAmountKobo}), 0)`
    })
    .from(riderBookings)
    .where(
      and(
        eq(riderBookings.paymentStatus, 'paid'),
        sql`${riderBookings.paidAt} is not null`,
        sql`${riderBookings.paidAt} >= ${yearStart}`
      )
    )
    .groupBy(sql`date_trunc('quarter', ${riderBookings.paidAt})`)
    .orderBy(sql`date_trunc('quarter', ${riderBookings.paidAt}) asc`);

  const annualAudit = await db
    .select({
      period: sql<string>`date_trunc('year', ${riderBookings.paidAt})::text`,
      incomeKobo: sql<number>`coalesce(sum(${riderBookings.grossAmountKobo}), 0)`
    })
    .from(riderBookings)
    .where(
      and(
        eq(riderBookings.paymentStatus, 'paid'),
        sql`${riderBookings.paidAt} is not null`
      )
    )
    .groupBy(sql`date_trunc('year', ${riderBookings.paidAt})`)
    .orderBy(sql`date_trunc('year', ${riderBookings.paidAt}) asc`);

  return {
    users: usersList,
    counts: { users: usersList.length },
    totals: {
      incomeTotalKobo: incomeTotal,
      paidOutTotalKobo: paidOutTotal,
      outstandingPayoutsKobo: outstandingPayouts,
      netWorthKobo: incomeTotal - paidOutTotal
    },
    periods: {
      daily: {
        incomeKobo: incomeDaily,
        expensesKobo: expensesDaily,
        netKobo: incomeDaily - expensesDaily
      },
      monthly: {
        incomeKobo: incomeMonthly,
        expensesKobo: expensesMonthly,
        netKobo: incomeMonthly - expensesMonthly
      },
      quarterly: {
        incomeKobo: incomeQuarterly,
        expensesKobo: expensesQuarterly,
        netKobo: incomeQuarterly - expensesQuarterly
      },
      annual: {
        incomeKobo: incomeAnnually,
        expensesKobo: expensesAnnually,
        netKobo: incomeAnnually - expensesAnnually
      }
    },
    audit: {
      quarterly: quarterlyAudit,
      annual: annualAudit
    }
  };
}
