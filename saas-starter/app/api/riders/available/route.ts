import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { riderProfiles, users } from '@/lib/db/schema';

export const runtime = 'nodejs';

/**
 * Public listing endpoint for rider discovery (first booking slice).
 * Returns only verified + available riders with non-sensitive profile fields.
 */
export async function GET() {
  const riders = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: riderProfiles.phone,
      vehicleType: riderProfiles.vehicleType,
      serviceZone: riderProfiles.serviceZone,
      availabilityStatus: riderProfiles.availabilityStatus
    })
    .from(riderProfiles)
    .innerJoin(users, eq(riderProfiles.userId, users.id))
    .where(
      and(
        eq(riderProfiles.verificationStatus, 'verified'),
        eq(riderProfiles.availabilityStatus, 'available'),
        isNull(users.deletedAt)
      )
    );

  return Response.json({
    riders,
    count: riders.length
  });
}

