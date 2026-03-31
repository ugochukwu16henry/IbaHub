import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { riderLocations, riderProfiles, users } from '@/lib/db/schema';
import { fromMicroDegrees, haversineKm } from '@/lib/rides/geo';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pickupLat = Number(url.searchParams.get('pickupLat'));
  const pickupLng = Number(url.searchParams.get('pickupLng'));

  if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng)) {
    return Response.json({ error: 'pickupLat and pickupLng are required' }, { status: 400 });
  }

  const riders = await db
    .select({
      riderProfileId: riderProfiles.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: riderProfiles.phone,
      vehicleType: riderProfiles.vehicleType,
      serviceZone: riderProfiles.serviceZone,
      photoUrl: riderProfiles.photoUrl,
      avgRating: riderProfiles.avgRating,
      ratingCount: riderProfiles.ratingCount,
      lat: riderLocations.lat,
      lng: riderLocations.lng,
      heading: riderLocations.heading
    })
    .from(riderProfiles)
    .innerJoin(users, eq(riderProfiles.userId, users.id))
    .innerJoin(riderLocations, eq(riderLocations.riderProfileId, riderProfiles.id))
    .where(
      and(
        eq(riderProfiles.verificationStatus, 'verified'),
        eq(riderProfiles.availabilityStatus, 'available'),
        eq(riderLocations.isOnline, true),
        isNull(users.deletedAt)
      )
    );

  const nearest = riders
    .map((r) => {
      const lat = fromMicroDegrees(r.lat);
      const lng = fromMicroDegrees(r.lng);
      const distanceKm = haversineKm(pickupLat, pickupLng, lat, lng);
      return {
        ...r,
        lat,
        lng,
        distanceKm,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 10);

  return Response.json({ riders: nearest, count: nearest.length });
}

