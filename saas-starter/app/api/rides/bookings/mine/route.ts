import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { riderBookings, riderProfiles, users } from '@/lib/db/schema';
import { fromMicroDegrees } from '@/lib/rides/geo';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const bookings = await db
    .select({
      id: riderBookings.id,
      bookingStatus: riderBookings.bookingStatus,
      paymentStatus: riderBookings.paymentStatus,
      pickupLabel: riderBookings.pickupLabel,
      dropoffLabel: riderBookings.dropoffLabel,
      pickupLat: riderBookings.pickupLat,
      pickupLng: riderBookings.pickupLng,
      dropoffLat: riderBookings.dropoffLat,
      dropoffLng: riderBookings.dropoffLng,
      grossAmountKobo: riderBookings.grossAmountKobo,
      platformFeeKobo: riderBookings.platformFeeKobo,
      riderNetKobo: riderBookings.riderNetKobo,
      createdAt: riderBookings.createdAt,
      riderName: users.name,
      riderPhone: riderProfiles.phone,
      riderPhotoUrl: riderProfiles.photoUrl,
      riderAvgRating: riderProfiles.avgRating,
      riderRatingCount: riderProfiles.ratingCount
    })
    .from(riderBookings)
    .leftJoin(riderProfiles, eq(riderBookings.riderProfileId, riderProfiles.id))
    .leftJoin(users, eq(riderProfiles.userId, users.id))
    .where(eq(riderBookings.customerUserId, user.id))
    .orderBy(desc(riderBookings.createdAt));

  return Response.json({
    bookings: bookings.map((b) => ({
      ...b,
      pickupLat: fromMicroDegrees(b.pickupLat),
      pickupLng: fromMicroDegrees(b.pickupLng),
      dropoffLat: fromMicroDegrees(b.dropoffLat),
      dropoffLng: fromMicroDegrees(b.dropoffLng)
    }))
  });
}

