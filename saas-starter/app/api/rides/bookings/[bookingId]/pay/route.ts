import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { riderBookings } from '@/lib/db/schema';
import { initializePaystackTransaction } from '@/lib/payments/paystack-marketplace';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await context.params;
  const id = parseInt(bookingId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  const [booking] = await db
    .select()
    .from(riderBookings)
    .where(and(eq(riderBookings.id, id), eq(riderBookings.customerUserId, user.id)))
    .limit(1);

  if (!booking) {
    return Response.json({ error: 'Booking not found' }, { status: 404 });
  }
  if (booking.paymentStatus === 'paid') {
    return Response.json({ error: 'Booking already paid' }, { status: 409 });
  }

  const reference = `ride_${booking.id}_${Date.now()}`;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/dashboard/rides/book?payment=callback`;
  const tx = await initializePaystackTransaction({
    email: user.email,
    amountKobo: booking.grossAmountKobo,
    reference,
    callbackUrl,
    metadata: {
      kind: 'rider_booking',
      riderBookingId: booking.id,
      grossAmountKobo: booking.grossAmountKobo,
    },
  });

  await db
    .update(riderBookings)
    .set({ paystackReference: tx.reference, updatedAt: new Date() })
    .where(eq(riderBookings.id, booking.id));

  return Response.json({ authorizationUrl: tx.authorization_url, reference: tx.reference });
}

