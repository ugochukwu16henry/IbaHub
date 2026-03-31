import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { riderBookings, riderProfiles } from '@/lib/db/schema';
import { fareWithCommission } from '@/lib/rides/pricing';
import { toMicroDegrees } from '@/lib/rides/geo';

export const runtime = 'nodejs';

const createBookingSchema = z.object({
  riderProfileId: z.number().int().positive(),
  pickupLabel: z.string().min(2).max(160),
  dropoffLabel: z.string().min(2).max(160),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  quotedFareNaira: z.number().positive(),
});

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const [rider] = await db
    .select()
    .from(riderProfiles)
    .where(
      and(
        eq(riderProfiles.id, payload.riderProfileId),
        eq(riderProfiles.verificationStatus, 'verified'),
        eq(riderProfiles.availabilityStatus, 'available')
      )
    )
    .limit(1);

  if (!rider) {
    return Response.json({ error: 'Rider unavailable' }, { status: 409 });
  }

  const quotedFareKobo = Math.round(payload.quotedFareNaira * 100);
  const { grossAmountKobo, platformFeeKobo, riderNetKobo } =
    fareWithCommission(quotedFareKobo);

  const [booking] = await db
    .insert(riderBookings)
    .values({
      customerUserId: user.id,
      riderProfileId: rider.id,
      pickupLabel: payload.pickupLabel.trim(),
      dropoffLabel: payload.dropoffLabel.trim(),
      pickupLat: toMicroDegrees(payload.pickupLat),
      pickupLng: toMicroDegrees(payload.pickupLng),
      dropoffLat: toMicroDegrees(payload.dropoffLat),
      dropoffLng: toMicroDegrees(payload.dropoffLng),
      quotedFareKobo,
      grossAmountKobo,
      platformFeeKobo,
      riderNetKobo,
      paymentStatus: 'unpaid',
      bookingStatus: 'requested',
    })
    .returning();

  return Response.json({ booking }, { status: 201 });
}

