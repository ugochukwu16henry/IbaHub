'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type FinanceData = {
  users: Array<{
    id: number;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
  }>;
  counts: { users: number };
  totals: {
    incomeTotalKobo: number;
    paidOutTotalKobo: number;
    outstandingPayoutsKobo: number;
    netWorthKobo: number;
  };
  periods: {
    daily: { incomeKobo: number; expensesKobo: number; netKobo: number };
    monthly: { incomeKobo: number; expensesKobo: number; netKobo: number };
    quarterly: { incomeKobo: number; expensesKobo: number; netKobo: number };
    annual: { incomeKobo: number; expensesKobo: number; netKobo: number };
  };
  audit: {
    quarterly: Array<{ period: string; incomeKobo: number }>;
    annual: Array<{ period: string; incomeKobo: number }>;
  };
};

const money = (kobo: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(kobo / 100);

function MetricRow({
  label,
  income,
  expenses,
  net
}: {
  label: string;
  income: number;
  expenses: number;
  net: number;
}) {
  return (
    <div className="border rounded-lg p-3">
      <p className="font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">
        Income: {money(income)} • Expenses: {money(expenses)} • Net: {money(net)}
      </p>
    </div>
  );
}

export default function AdminFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const exportQuery =
    fromDate || toDate
      ? `?${new URLSearchParams({
          ...(fromDate ? { from: fromDate } : {}),
          ...(toDate ? { to: toDate } : {})
        }).toString()}`
      : '';

  async function load() {
    setError('');
    const res = await fetch('/api/admin/finance/overview');
    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error || 'Failed to load finance dashboard');
      return;
    }
    setData(payload);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-5xl space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href="/dashboard/hub/payments">
          <ArrowLeft className="size-4 mr-1" />
          Hub payments
        </Link>
      </Button>
      <h1 className="text-lg lg:text-2xl font-medium">Admin Finance & Audit</h1>
      <Card>
        <CardHeader>
          <CardTitle>Export date range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">From</p>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">To</p>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            setFromDate('');
            setToDate('');
          }}>
            Clear range
          </Button>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/admin/finance/export/users${exportQuery}`}>Export users CSV</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/admin/finance/export/payouts${exportQuery}`}>Export payouts CSV</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/admin/finance/export/pnl-monthly${exportQuery}`}>Export monthly P&L CSV</a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/admin/finance/export/audit${exportQuery}`}>Export audit CSV</a>
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!data ? (
        <p className="text-sm text-muted-foreground">Loading finance data…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Total users: {data.counts.users}</p>
              <p>Total income: {money(data.totals.incomeTotalKobo)}</p>
              <p>Total paid out: {money(data.totals.paidOutTotalKobo)}</p>
              <p>Outstanding payouts: {money(data.totals.outstandingPayoutsKobo)}</p>
              <p className="font-medium">Net worth: {money(data.totals.netWorthKobo)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Period Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricRow
                label="Daily"
                income={data.periods.daily.incomeKobo}
                expenses={data.periods.daily.expensesKobo}
                net={data.periods.daily.netKobo}
              />
              <MetricRow
                label="Monthly"
                income={data.periods.monthly.incomeKobo}
                expenses={data.periods.monthly.expensesKobo}
                net={data.periods.monthly.netKobo}
              />
              <MetricRow
                label="Quarterly"
                income={data.periods.quarterly.incomeKobo}
                expenses={data.periods.quarterly.expensesKobo}
                net={data.periods.quarterly.netKobo}
              />
              <MetricRow
                label="Annual"
                income={data.periods.annual.incomeKobo}
                expenses={data.periods.annual.expensesKobo}
                net={data.periods.annual.netKobo}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quarterly / Annual Audit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">Quarterly income</p>
                <ul className="space-y-1">
                  {data.audit.quarterly.map((q) => (
                    <li key={q.period} className="text-muted-foreground">
                      {new Date(q.period).toLocaleDateString()} • {money(Number(q.incomeKobo))}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Annual income</p>
                <ul className="space-y-1">
                  {data.audit.annual.map((a) => (
                    <li key={a.period} className="text-muted-foreground">
                      {new Date(a.period).getFullYear()} • {money(Number(a.incomeKobo))}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {data.users.map((u) => (
                  <div key={u.id} className="border rounded-lg p-2">
                    <p className="font-medium">{u.name || '(no name)'}</p>
                    <p className="text-muted-foreground">
                      {u.email} • {u.role} • Joined{' '}
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}

