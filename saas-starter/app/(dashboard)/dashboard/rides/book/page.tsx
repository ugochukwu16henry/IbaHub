'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type NearestRider = {
  riderProfileId: number;
  name: string | null;
  phone: string | null;
  photoUrl: string | null;
  avgRating: number;
  ratingCount: number;
  lat: number;
  lng: number;
  distanceKm: number;
};

type Booking = {
  id: number;
  bookingStatus: string;
  paymentStatus: string;
  pickupLabel: string;
  dropoffLabel: string;
  grossAmountKobo: number;
  platformFeeKobo: number;
  riderNetKobo: number;
  riderName: string | null;
  riderPhone: string | null;
  riderPhotoUrl: string | null;
  riderAvgRating: number | null;
  riderRatingCount: number | null;
};

const money = (kobo: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(kobo / 100);

function RideBookingPageContent() {
  const searchParams = useSearchParams();
  const [pickupLabel, setPickupLabel] = useState('Campus main gate');
  const [dropoffLabel, setDropoffLabel] = useState('Hostel block B');
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [riders, setRiders] = useState<NearestRider[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRider = riders[0];
  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
  const estimatedFareNaira = useMemo(() => {
    if (!selectedRider) return 0;
    return Math.max(Math.round(selectedRider.distanceKm * 1000), 500);
  }, [selectedRider]);
  const mapImageUrl =
    mapToken && pickupLat !== null && pickupLng !== null
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pickupLng},${pickupLat},14/800x300?access_token=${mapToken}`
      : null;

  async function geocode(query: string) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
    if (!token) throw new Error('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is not configured');
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${token}&limit=1`
    );
    const data = await res.json();
    const coords = data?.features?.[0]?.center;
    if (!coords) throw new Error(`Could not geocode "${query}"`);
    return { lng: Number(coords[0]), lat: Number(coords[1]) };
  }

  async function refreshRiders() {
    if (pickupLat === null || pickupLng === null) return;
    const res = await fetch(
      `/api/rides/nearest?pickupLat=${pickupLat}&pickupLng=${pickupLng}`
    );
    const data = await res.json();
    if (res.ok) setRiders(data.riders || []);
  }

  async function refreshBookings() {
    const res = await fetch('/api/rides/bookings/mine');
    const data = await res.json();
    if (res.ok) setMyBookings(data.bookings || []);
  }

  useEffect(() => {
    const pickup = searchParams.get('pickupLabel');
    const dropoff = searchParams.get('dropoffLabel');
    if (pickup) setPickupLabel(pickup);
    if (dropoff) setDropoffLabel(dropoff);
  }, [searchParams]);

  useEffect(() => {
    refreshBookings();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      refreshRiders();
      refreshBookings();
    }, 8000);
    return () => clearInterval(id);
  }, [pickupLat, pickupLng]);

  async function detectMyLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupLat(pos.coords.latitude);
        setPickupLng(pos.coords.longitude);
      },
      () => setError('Could not get your location')
    );
  }

  async function lookupRoutePoints() {
    setError(null);
    try {
      setLoading(true);
      const [p, d] = await Promise.all([geocode(pickupLabel), geocode(dropoffLabel)]);
      setPickupLat(p.lat);
      setPickupLng(p.lng);
      setDropoffLat(d.lat);
      setDropoffLng(d.lng);
      await refreshRiders();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resolve locations');
    } finally {
      setLoading(false);
    }
  }

  async function createBooking(riderProfileId: number) {
    if (
      pickupLat === null ||
      pickupLng === null ||
      dropoffLat === null ||
      dropoffLng === null
    ) {
      setError('Set pickup and dropoff locations first');
      return;
    }
    const res = await fetch('/api/rides/bookings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        riderProfileId,
        pickupLabel,
        dropoffLabel,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        quotedFareNaira: estimatedFareNaira
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not create booking');
      return;
    }
    await refreshBookings();
  }

  async function payBooking(bookingId: number) {
    const res = await fetch(`/api/rides/bookings/${bookingId}/pay`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not initialize payment');
      return;
    }
    if (data.authorizationUrl) window.location.href = data.authorizationUrl;
  }

  async function confirmCompletion(bookingId: number) {
    const res = await fetch(`/api/rides/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'confirm' })
    });
    if (res.ok) refreshBookings();
  }

  async function rateBooking(bookingId: number, rating: number) {
    const res = await fetch(`/api/rides/bookings/${bookingId}/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rating })
    });
    if (res.ok) refreshBookings();
  }

  return (
    <section className="flex-1 p-4 lg:p-8 space-y-6">
      <h1 className="text-lg lg:text-2xl font-medium">Book a Ride</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pickup & Dropoff</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={pickupLabel} onChange={(e) => setPickupLabel(e.target.value)} placeholder="Pickup location" />
          <Input value={dropoffLabel} onChange={(e) => setDropoffLabel(e.target.value)} placeholder="Dropoff location" />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={lookupRoutePoints} disabled={loading}>
              {loading ? 'Resolving...' : 'Find nearest riders'}
            </Button>
            <Button variant="outline" onClick={detectMyLocation}>
              Use my live location
            </Button>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <p className="text-xs text-muted-foreground">
            Estimated fare shown includes platform flow. Platform keeps 5%.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Closest Riders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mapImageUrl ? (
            <img
              src={mapImageUrl}
              alt="Live map around pickup"
              className="w-full rounded-md border object-cover"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to view live pickup map.
            </p>
          )}
          {riders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No nearby rider found yet.</p>
          ) : (
            riders.map((r) => (
              <div key={r.riderProfileId} className="border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt="Rider face" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      No photo
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{r.name || 'Rider'}</p>
                    <p className="text-xs text-muted-foreground">
                      Distance: {r.distanceKm.toFixed(2)} km • Rating:{' '}
                      {((r.avgRating || 0) / 10).toFixed(1)} ({r.ratingCount || 0})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contact: {r.phone || 'not provided'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">~ ₦{estimatedFareNaira}</p>
                    <Button size="sm" onClick={() => createBooking(r.riderProfileId)}>
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Ride Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rides booked yet.</p>
          ) : (
            myBookings.map((b) => (
              <div key={b.id} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium">
                  {b.pickupLabel} {'->'} {b.dropoffLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rider: {b.riderName || 'N/A'} | Contact: {b.riderPhone || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {b.bookingStatus} | Payment: {b.paymentStatus}
                </p>
                <p className="text-xs text-muted-foreground">
                  You pay {money(b.grossAmountKobo)} | Platform fee {money(b.platformFeeKobo)} |
                  Rider receives {money(b.riderNetKobo)}
                </p>
                {b.paymentStatus !== 'paid' ? (
                  <Button size="sm" onClick={() => payBooking(b.id)}>
                    Pay before ride starts
                  </Button>
                ) : null}
                {b.bookingStatus === 'awaiting_confirmation' ? (
                  <Button size="sm" variant="outline" onClick={() => confirmCompletion(b.id)}>
                    Confirm service completion
                  </Button>
                ) : null}
                {b.bookingStatus === 'completed' ? (
                  <div className="flex gap-2">
                    {[5, 4, 3].map((r) => (
                      <Button key={r} size="sm" variant="outline" onClick={() => rateBooking(b.id, r)}>
                        Rate {r}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default function RideBookingPage() {
  return (
    <Suspense fallback={<section className="flex-1 p-4 lg:p-8">Loading ride booking...</section>}>
      <RideBookingPageContent />
    </Suspense>
  );
}

