import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { riderBookings, riderProfiles, riderReviews } from '@/lib/db/schema';

export const runtime = 'nodejs';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await context.params;
  const id = parseInt(bookingId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid review payload' }, { status: 400 });
  }

  const [booking] = await db
    .select()
    .from(riderBookings)
    .where(and(eq(riderBookings.id, id), eq(riderBookings.customerUserId, user.id)))
    .limit(1);
  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
  if (booking.bookingStatus !== 'completed' || !booking.riderProfileId) {
    return Response.json({ error: 'Booking is not reviewable yet' }, { status: 409 });
  }

  const [review] = await db
    .insert(riderReviews)
    .values({
      bookingId: booking.id,
      customerUserId: user.id,
      riderProfileId: booking.riderProfileId,
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null
    })
    .onConflictDoNothing()
    .returning();

  if (!review) {
    return Response.json({ error: 'Review already exists for this booking' }, { status: 409 });
  }

  const all = await db
    .select({ rating: riderReviews.rating })
    .from(riderReviews)
    .where(eq(riderReviews.riderProfileId, booking.riderProfileId));
  const count = all.length;
  const sum = all.reduce((acc, r) => acc + r.rating, 0);
  const avg = count > 0 ? Math.round((sum / count) * 10) : 0;

  await db
    .update(riderProfiles)
    .set({
      avgRating: avg,
      ratingCount: count,
      updatedAt: new Date()
    })
    .where(eq(riderProfiles.id, booking.riderProfileId));

  return Response.json({ review }, { status: 201 });
}

