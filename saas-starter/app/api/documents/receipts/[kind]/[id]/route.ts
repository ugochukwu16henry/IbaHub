import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import {
  retailPosTransactions,
  retailPurchaseRequests,
  riderBookings,
  teams,
  users
} from '@/lib/db/schema';
import { renderPdfWithQuestPdf } from '@/lib/pdf/questpdf-client';

export const runtime = 'nodejs';

type Params = { kind: string; id: string };

function parsePositiveInt(raw: string) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

function money(kobo: number) {
  return Number((kobo || 0) / 100);
}

export async function GET(_: Request, context: { params: Promise<Params> }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { kind, id } = await context.params;
  const docId = parsePositiveInt(id);
  if (!docId) return Response.json({ error: 'Invalid id' }, { status: 400 });

  try {
    if (kind === 'retail-pos') {
      const team = await getTeamForUser();
      if (!team) return Response.json({ error: 'No team found' }, { status: 403 });

      const [tx] = await db
        .select({
          id: retailPosTransactions.id,
          teamId: retailPosTransactions.teamId,
          amountKobo: retailPosTransactions.amountKobo,
          paymentMethod: retailPosTransactions.paymentMethod,
          status: retailPosTransactions.status,
          createdAt: retailPosTransactions.createdAt,
          idempotencyKey: retailPosTransactions.idempotencyKey
        })
        .from(retailPosTransactions)
        .where(and(eq(retailPosTransactions.id, docId), eq(retailPosTransactions.teamId, team.id)))
        .limit(1);

      if (!tx) return Response.json({ error: 'Receipt not found' }, { status: 404 });

      const pdf = await renderPdfWithQuestPdf({
        template: 'payment_receipt',
        title: 'Retail POS Receipt',
        reference: tx.idempotencyKey || `POS-${tx.id}`,
        issuedAtIso: tx.createdAt?.toISOString?.() ?? new Date().toISOString(),
        currency: 'NGN',
        totals: { gross: money(tx.amountKobo) },
        parties: { from: team.name, to: user.name || user.email },
        lineItems: [
          {
            label: `POS payment (${tx.paymentMethod})`,
            quantity: 1,
            unitAmount: money(tx.amountKobo),
            totalAmount: money(tx.amountKobo)
          }
        ],
        notes: `Status: ${tx.status}`
      });

      return new Response(pdf, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="retail-pos-${tx.id}.pdf"`
        }
      });
    }

    if (kind === 'rider-booking') {
      const [booking] = await db
        .select({
          id: riderBookings.id,
          customerUserId: riderBookings.customerUserId,
          grossAmountKobo: riderBookings.grossAmountKobo,
          platformFeeKobo: riderBookings.platformFeeKobo,
          riderNetKobo: riderBookings.riderNetKobo,
          paymentStatus: riderBookings.paymentStatus,
          paystackReference: riderBookings.paystackReference,
          createdAt: riderBookings.createdAt,
          pickupLabel: riderBookings.pickupLabel,
          dropoffLabel: riderBookings.dropoffLabel
        })
        .from(riderBookings)
        .where(and(eq(riderBookings.id, docId), eq(riderBookings.customerUserId, user.id)))
        .limit(1);

      if (!booking) return Response.json({ error: 'Receipt not found' }, { status: 404 });

      const pdf = await renderPdfWithQuestPdf({
        template: 'payment_receipt',
        title: 'Ride Payment Receipt',
        reference: booking.paystackReference || `RIDE-${booking.id}`,
        issuedAtIso: booking.createdAt?.toISOString?.() ?? new Date().toISOString(),
        currency: 'NGN',
        totals: {
          gross: money(booking.grossAmountKobo),
          fee: money(booking.platformFeeKobo),
          net: money(booking.riderNetKobo)
        },
        parties: { from: user.name || user.email, to: 'Rider Partner' },
        lineItems: [
          {
            label: `${booking.pickupLabel} -> ${booking.dropoffLabel}`,
            quantity: 1,
            unitAmount: money(booking.grossAmountKobo),
            totalAmount: money(booking.grossAmountKobo)
          }
        ],
        notes: `Payment status: ${booking.paymentStatus}`
      });

      return new Response(pdf, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="ride-booking-${booking.id}.pdf"`
        }
      });
    }

    if (kind === 'purchase-request') {
      const [purchase] = await db
        .select({
          id: retailPurchaseRequests.id,
          teamId: retailPurchaseRequests.teamId,
          buyerUserId: retailPurchaseRequests.buyerUserId,
          totalAmountKobo: retailPurchaseRequests.totalAmountKobo,
          agreedUnitPriceKobo: retailPurchaseRequests.agreedUnitPriceKobo,
          quantity: retailPurchaseRequests.quantity,
          status: retailPurchaseRequests.status,
          createdAt: retailPurchaseRequests.createdAt,
          teamName: teams.name,
          buyerName: users.name,
          buyerEmail: users.email
        })
        .from(retailPurchaseRequests)
        .innerJoin(teams, eq(retailPurchaseRequests.teamId, teams.id))
        .innerJoin(users, eq(retailPurchaseRequests.buyerUserId, users.id))
        .where(eq(retailPurchaseRequests.id, docId))
        .limit(1);

      if (!purchase) return Response.json({ error: 'Receipt not found' }, { status: 404 });

      const team = await getTeamForUser();
      const canAccess =
        purchase.buyerUserId === user.id || (team && team.id === purchase.teamId);
      if (!canAccess) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const buyerName = purchase.buyerName || purchase.buyerEmail;
      const pdf = await renderPdfWithQuestPdf({
        template: 'payment_receipt',
        title: 'Business Owner Purchase Receipt',
        reference: `PR-${purchase.id}`,
        issuedAtIso: purchase.createdAt?.toISOString?.() ?? new Date().toISOString(),
        currency: 'NGN',
        totals: { gross: money(purchase.totalAmountKobo) },
        parties: { from: purchase.teamName, to: buyerName },
        lineItems: [
          {
            label: 'Purchase request payment',
            quantity: purchase.quantity,
            unitAmount: money(purchase.agreedUnitPriceKobo),
            totalAmount: money(purchase.totalAmountKobo)
          }
        ],
        notes: `Status: ${purchase.status}`
      });

      return new Response(pdf, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="purchase-request-${purchase.id}.pdf"`
        }
      });
    }

    return Response.json(
      { error: 'Unsupported receipt type. Use retail-pos, rider-booking, or purchase-request.' },
      { status: 400 }
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown';
    return Response.json({ error: 'PDF generation failed', detail }, { status: 502 });
  }
}
