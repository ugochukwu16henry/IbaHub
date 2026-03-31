import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { payoutLedger, riderBookings, riderProfiles } from '@/lib/db/schema';

export const runtime = 'nodejs';

const statusSchema = z.object({
  action: z.enum(['accept', 'start', 'mark_done', 'confirm', 'cancel'])
});

async function assertRiderOwner(riderProfileId: number, userId: number) {
  const [rider] = await db
    .select()
    .from(riderProfiles)
    .where(eq(riderProfiles.id, riderProfileId))
    .limit(1);
  return !!rider && rider.userId === userId;
}

export async function PATCH(
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

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid action' }, { status: 400 });
  }

  const [booking] = await db
    .select()
    .from(riderBookings)
    .where(eq(riderBookings.id, id))
    .limit(1);
  if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

  const action = parsed.data.action;
  const riderId = booking.riderProfileId ?? 0;
  const riderAllowed = riderId ? await assertRiderOwner(riderId, user.id) : false;
  const customerAllowed = booking.customerUserId === user.id;

  if (action === 'accept' || action === 'start' || action === 'mark_done') {
    if (!riderAllowed) return Response.json({ error: 'Forbidden' }, { status: 403 });
  } else if (action === 'confirm' || action === 'cancel') {
    if (!customerAllowed && !riderAllowed) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (action === 'start' && booking.paymentStatus !== 'paid') {
    return Response.json(
      { error: 'Customer must pay before service can start' },
      { status: 409 }
    );
  }

  if (action === 'accept') {
    await db
      .update(riderBookings)
      .set({
        bookingStatus: 'accepted',
        riderAcceptedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(riderBookings.id, booking.id));
  }

  if (action === 'start') {
    await db
      .update(riderBookings)
      .set({
        bookingStatus: 'in_progress',
        riderStartedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(riderBookings.id, booking.id));
  }

  if (action === 'mark_done') {
    await db
      .update(riderBookings)
      .set({
        bookingStatus: 'awaiting_confirmation',
        riderCompletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(riderBookings.id, booking.id));
  }

  if (action === 'confirm') {
    if (booking.bookingStatus !== 'awaiting_confirmation') {
      return Response.json({ error: 'Booking not awaiting confirmation' }, { status: 409 });
    }
    await db
      .update(riderBookings)
      .set({
        bookingStatus: 'completed',
        customerConfirmedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(riderBookings.id, booking.id));

    if (booking.riderProfileId) {
      await db
        .insert(payoutLedger)
        .values({
          bookingId: booking.id,
          riderProfileId: booking.riderProfileId,
          amountNetKobo: booking.riderNetKobo,
          status: 'ready_for_payout'
        })
        .onConflictDoNothing();
    }
  }

  if (action === 'cancel') {
    await db
      .update(riderBookings)
      .set({
        bookingStatus: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(riderBookings.id, booking.id));
  }

  const [updated] = await db
    .select()
    .from(riderBookings)
    .where(eq(riderBookings.id, booking.id))
    .limit(1);
  return Response.json({ booking: updated });
}

