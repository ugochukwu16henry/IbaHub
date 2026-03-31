'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type RiderProfile = {
  id: number;
  phone: string | null;
  vehicleType: string | null;
  serviceZone: string | null;
  availabilityStatus: string;
  photoUrl: string | null;
  verificationStatus: string;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
};

type RiderBooking = {
  id: number;
  bookingStatus: string;
  paymentStatus: string;
  pickupLabel: string;
  dropoffLabel: string;
  customerName: string | null;
  customerEmail: string;
  grossAmountKobo: number;
  platformFeeKobo: number;
  riderNetKobo: number;
};

type RiderPayout = {
  id: number;
  bookingId: number;
  amountNetKobo: number;
  status: string;
  transferReference: string | null;
};

const money = (kobo: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(kobo / 100);

export default function RiderConsolePage() {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [bookings, setBookings] = useState<RiderBooking[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [online, setOnline] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payouts, setPayouts] = useState<RiderPayout[]>([]);
  const [payoutMessage, setPayoutMessage] = useState('');

  async function load() {
    const p = await fetch('/api/riders/me').then((r) => r.json());
    if (p.profile) {
      setProfile(p.profile);
      setPhotoUrl(p.profile.photoUrl || '');
      setOnline(p.profile.availabilityStatus === 'available');
      setBankCode(p.profile.bankCode || '');
      setAccountNumber(p.profile.accountNumber || '');
      setAccountName(p.profile.accountName || '');
    }
    const b = await fetch('/api/rides/bookings/rider').then((r) => r.json());
    setBookings(b.bookings || []);
    const payoutRes = await fetch('/api/rides/payouts/rider').then((r) => r.json());
    setPayouts(payoutRes.payouts || []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!online) return;
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await fetch('/api/riders/me', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || 0,
            isOnline: true,
            availabilityStatus: 'available'
          })
        });
      });
      load();
    }, 8000);
    return () => clearInterval(id);
  }, [online]);

  async function saveProfile() {
    await fetch('/api/riders/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        photoUrl,
        bankCode,
        accountNumber,
        accountName,
        availabilityStatus: online ? 'available' : 'offline',
        isOnline: online
      })
    });
    load();
  }

  async function releasePayout(payoutId: number) {
    setPayoutMessage('');
    const res = await fetch(`/api/rides/payouts/${payoutId}/release`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) {
      setPayoutMessage(data.error || 'Payout release failed');
    } else {
      setPayoutMessage(`Payout sent successfully (${data.transferReference || 'ok'})`);
    }
    load();
  }

  async function act(bookingId: number, action: string) {
    await fetch(`/api/rides/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action })
    });
    load();
  }

  return (
    <section className="flex-1 p-4 lg:p-8 space-y-6">
      <h1 className="text-lg lg:text-2xl font-medium">Rider Console</h1>

      <Card>
        <CardHeader>
          <CardTitle>Rider Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Verification: {profile?.verificationStatus || 'unknown'} | Availability:{' '}
            {profile?.availabilityStatus || 'offline'}
          </p>
          <Input
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="Face photo URL"
          />
          <div className="grid md:grid-cols-3 gap-2">
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
          </div>
          <div className="flex gap-2">
            <Button variant={online ? 'default' : 'outline'} onClick={() => setOnline(true)}>
              Go online
            </Button>
            <Button variant={!online ? 'default' : 'outline'} onClick={() => setOnline(false)}>
              Go offline
            </Button>
            <Button onClick={saveProfile}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payoutMessage ? (
            <p className="text-sm text-muted-foreground">{payoutMessage}</p>
          ) : null}
          {payouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts yet.</p>
          ) : (
            payouts.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">
                  Booking #{p.bookingId} • {money(p.amountNetKobo)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {p.status} {p.transferReference ? `• Ref: ${p.transferReference}` : ''}
                </p>
                {p.status === 'ready_for_payout' ? (
                  <Button size="sm" onClick={() => releasePayout(p.id)}>
                    Release payout to bank
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incoming Ride Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ride requests yet.</p>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium">
                  {b.pickupLabel} {'->'} {b.dropoffLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  Customer: {b.customerName || b.customerEmail}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {b.bookingStatus} | Payment: {b.paymentStatus}
                </p>
                <p className="text-xs text-muted-foreground">
                  Gross {money(b.grossAmountKobo)} | Fee {money(b.platformFeeKobo)} | You get{' '}
                  {money(b.riderNetKobo)}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => act(b.id, 'accept')}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => act(b.id, 'start')}>
                    Start ride
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => act(b.id, 'mark_done')}>
                    Mark done
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

