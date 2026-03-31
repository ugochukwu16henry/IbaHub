'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function RiderSettingsPage() {
  const [photoUrl, setPhotoUrl] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const res = await fetch('/api/riders/me');
    const data = await res.json();
    if (!res.ok || !data.profile) return;
    setPhotoUrl(data.profile.photoUrl || '');
    setBankCode(data.profile.bankCode || '');
    setAccountNumber(data.profile.accountNumber || '');
    setAccountName(data.profile.accountName || '');
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setMessage('');
    const res = await fetch('/api/riders/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        photoUrl,
        bankCode,
        accountNumber,
        accountName
      })
    });
    if (res.ok) {
      setMessage('Rider payout settings saved.');
    } else {
      const data = await res.json();
      setMessage(data.error || 'Failed to save settings');
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-2xl space-y-4">
      <h1 className="text-lg lg:text-2xl font-medium">Rider payout settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bank account for automatic payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="Face photo URL"
          />
          <Input
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            placeholder="Bank code (e.g. 058)"
          />
          <Input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Account number"
          />
          <Input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Account name"
          />
          <Button onClick={save}>Save settings</Button>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <p className="text-xs text-muted-foreground">
            Once customer confirms service completion, payout is sent automatically after the delay
            window using these bank details.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

