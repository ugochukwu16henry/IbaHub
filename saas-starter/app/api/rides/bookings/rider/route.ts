import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { riderBookings, riderProfiles, users } from '@/lib/db/schema';
import { fromMicroDegrees } from '@/lib/rides/geo';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const [rider] = await db
    .select()
    .from(riderProfiles)
    .where(eq(riderProfiles.userId, user.id))
    .limit(1);
  if (!rider) return Response.json({ error: 'Rider profile not found' }, { status: 404 });

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
      customerName: users.name,
      customerEmail: users.email
    })
    .from(riderBookings)
    .innerJoin(users, eq(riderBookings.customerUserId, users.id))
    .where(eq(riderBookings.riderProfileId, rider.id))
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

