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

  async function load() {
    const p = await fetch('/api/riders/me').then((r) => r.json());
    if (p.profile) {
      setProfile(p.profile);
      setPhotoUrl(p.profile.photoUrl || '');
      setOnline(p.profile.availabilityStatus === 'available');
    }
    const b = await fetch('/api/rides/bookings/rider').then((r) => r.json());
    setBookings(b.bookings || []);
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
        availabilityStatus: online ? 'available' : 'offline',
        isOnline: online
      })
    });
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
          <CardTitle>Incoming Ride Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ride requests yet.</p>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium">
                  {b.pickupLabel} -> {b.dropoffLabel}
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

