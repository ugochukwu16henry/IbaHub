import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { riderLocations, riderProfiles, users } from '@/lib/db/schema';
import { fromMicroDegrees, haversineKm } from '@/lib/rides/geo';

export const runtime = 'nodejs';

/**
 * Public listing endpoint for rider discovery (first booking slice).
 * Returns only verified + available riders with non-sensitive profile fields.
 */
export async function GET(request: Request) {
  // Optional nearest search: /api/riders/available?pickupLat=...&pickupLng=...
  // Falls back to regular verified/available list when pickup is absent.
  return listRiders(request);
}

async function listRiders(request?: Request) {
  const pickupLat = request ? Number(new URL(request.url).searchParams.get('pickupLat')) : NaN;
  const pickupLng = request ? Number(new URL(request.url).searchParams.get('pickupLng')) : NaN;

  const riders = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: riderProfiles.phone,
      vehicleType: riderProfiles.vehicleType,
      serviceZone: riderProfiles.serviceZone,
      availabilityStatus: riderProfiles.availabilityStatus,
      photoUrl: riderProfiles.photoUrl,
      avgRating: riderProfiles.avgRating,
      ratingCount: riderProfiles.ratingCount,
      lat: riderLocations.lat,
      lng: riderLocations.lng,
    })
    .from(riderProfiles)
    .innerJoin(users, eq(riderProfiles.userId, users.id))
    .leftJoin(riderLocations, eq(riderLocations.riderProfileId, riderProfiles.id))
    .where(
      and(
        eq(riderProfiles.verificationStatus, 'verified'),
        eq(riderProfiles.availabilityStatus, 'available'),
        isNull(users.deletedAt)
      )
    );

  const withCoords = riders.map((r) => ({
    ...r,
    lat: r.lat !== null ? fromMicroDegrees(r.lat) : null,
    lng: r.lng !== null ? fromMicroDegrees(r.lng) : null
  }));

  const sorted =
    Number.isFinite(pickupLat) && Number.isFinite(pickupLng)
      ? withCoords
          .filter((r) => r.lat !== null && r.lng !== null)
          .map((r) => ({
            ...r,
            distanceKm: haversineKm(
              pickupLat,
              pickupLng,
              r.lat as number,
              r.lng as number
            )
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
      : withCoords;

  return Response.json({
    riders: sorted,
    count: sorted.length
  });
}

