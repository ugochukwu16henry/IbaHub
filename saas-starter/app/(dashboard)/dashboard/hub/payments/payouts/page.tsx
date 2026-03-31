'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AdminPayout = {
  id: number;
  bookingId: number;
  amountNetKobo: number;
  status: string;
  transferReference: string | null;
  riderName: string | null;
  riderEmail: string;
  createdAt: string;
};

const money = (kobo: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(kobo / 100);

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const res = await fetch('/api/admin/payouts');
    const data = await res.json();
    if (res.ok) setPayouts(data.payouts || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function release(payoutId: number) {
    setMessage('');
    const res = await fetch(`/api/admin/payouts/${payoutId}/release`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Release failed');
    } else {
      setMessage(`Release triggered (${data.transferReference || 'processing'})`);
    }
    load();
  }

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href="/dashboard/hub/payments">
          <ArrowLeft className="size-4 mr-1" />
          Hub payments
        </Link>
      </Button>
      <h1 className="text-lg lg:text-2xl font-medium">Admin Payouts</h1>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Payout ledger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payout records yet.</p>
          ) : (
            payouts.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium">
                  {money(p.amountNetKobo)} • Booking #{p.bookingId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rider: {p.riderName || p.riderEmail} • Status: {p.status}
                  {p.transferReference ? ` • Ref: ${p.transferReference}` : ''}
                </p>
                {(p.status === 'ready_for_payout' || p.status === 'failed') && (
                  <Button size="sm" onClick={() => release(p.id)}>
                    {p.status === 'failed' ? 'Retry payout' : 'Release payout'}
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

