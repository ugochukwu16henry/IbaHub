'use client';

import { useMemo, useState } from 'react';

export function BusinessLocationPicker({
  initialLat,
  initialLng
}: {
  initialLat: number | null;
  initialLng: number | null;
}) {
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [error, setError] = useState('');
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  const mapUrl = useMemo(() => {
    if (!token || lat === null || lng === null) return '';
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+f97316(${lng},${lat})/${lng},${lat},14/700x250?access_token=${token}`;
  }, [token, lat, lng]);

  function detectLocation() {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setError('Could not detect location.')
    );
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">Business live location</p>
      <button
        type="button"
        onClick={detectLocation}
        className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
      >
        Use my current shop location
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {mapUrl ? (
        <img src={mapUrl} alt="Business location map" className="w-full rounded-md border object-cover" />
      ) : (
        <p className="text-xs text-muted-foreground">
          Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to preview location map.
        </p>
      )}
      <input type="hidden" name="businessLat" value={lat ?? ''} />
      <input type="hidden" name="businessLng" value={lng ?? ''} />
    </div>
  );
}
