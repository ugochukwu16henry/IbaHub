import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import {
  retailPurchaseRequests,
  riderBookings,
  serviceRequests,
  teams,
  users
} from '@/lib/db/schema';
import { storeGeneratedPdf } from '@/lib/pdf/document-store';
import { renderPdfWithQuestPdf } from '@/lib/pdf/questpdf-client';
import { buildPaymentDocumentPayload } from '@/lib/pdf/templates';

export const runtime = 'nodejs';

const asMoney = (kobo: number) => Number((kobo || 0) / 100);

export async function GET(_: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { kind, id } = await context.params;
  const docId = Number(id);
  if (!Number.isFinite(docId) || docId <= 0) {
    return Response.json({ error: 'Invalid id' }, { status: 400 });
  }

  if (kind === 'rider-booking') {
    const [booking] = await db
      .select()
      .from(riderBookings)
      .where(and(eq(riderBookings.id, docId), eq(riderBookings.customerUserId, user.id)))
      .limit(1);
    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });

    const reference = booking.paystackReference || `RIDE-${booking.id}`;
    const pdf = await renderPdfWithQuestPdf(
      buildPaymentDocumentPayload({
        template: 'invoice',
        title: 'Ride Service Invoice',
        reference,
        issuedAtIso: booking.createdAt?.toISOString?.() ?? new Date().toISOString(),
        gross: asMoney(booking.grossAmountKobo),
        fee: asMoney(booking.platformFeeKobo),
        net: asMoney(booking.riderNetKobo),
        from: 'IbaHub Transport',
        to: user.name || user.email,
        lineItems: [
          {
            label: `${booking.pickupLabel} -> ${booking.dropoffLabel}`,
            quantity: 1,
            unitAmount: asMoney(booking.grossAmountKobo),
            totalAmount: asMoney(booking.grossAmountKobo)
          }
        ]
      })
    );

    const doc = await storeGeneratedPdf({
      sourceKind: 'rider_booking',
      sourceId: booking.id,
      userId: user.id,
      documentType: 'invoice',
      title: 'Ride Service Invoice',
      reference,
      pdfBytes: pdf
    });

    return new Response(pdf, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="ride-invoice-${booking.id}.pdf"`,
        'x-generated-document-id': String(doc.id)
      }
    });
  }

  if (kind === 'service-request') {
    const [row] = await db
      .select({
        id: serviceRequests.id,
        requesterUserId: serviceRequests.requesterUserId,
        providerTeamId: serviceRequests.providerTeamId,
        grossAmountKobo: serviceRequests.grossAmountKobo,
        platformFeeKobo: serviceRequests.platformFeeKobo,
        providerEarningsKobo: serviceRequests.providerEarningsKobo,
        paystackReference: serviceRequests.paystackReference,
        createdAt: serviceRequests.createdAt,
        message: serviceRequests.message,
        teamName: teams.name
      })
      .from(serviceRequests)
      .innerJoin(teams, eq(serviceRequests.providerTeamId, teams.id))
      .where(eq(serviceRequests.id, docId))
      .limit(1);
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

    const team = await getTeamForUser();
    const canAccess = row.requesterUserId === user.id || (team && team.id === row.providerTeamId);
    if (!canAccess) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const reference = row.paystackReference || `SR-${row.id}`;
    const pdf = await renderPdfWithQuestPdf(
      buildPaymentDocumentPayload({
        template: 'invoice',
        title: 'Service Invoice',
        reference,
        issuedAtIso: row.createdAt?.toISOString?.() ?? new Date().toISOString(),
        gross: asMoney(row.grossAmountKobo),
        fee: asMoney(row.platformFeeKobo),
        net: asMoney(row.providerEarningsKobo),
        from: row.teamName,
        to: user.name || user.email,
        lineItems: [
          {
            label: row.message || 'Service request',
            quantity: 1,
            unitAmount: asMoney(row.grossAmountKobo),
            totalAmount: asMoney(row.grossAmountKobo)
          }
        ]
      })
    );

    const doc = await storeGeneratedPdf({
      sourceKind: 'service_request',
      sourceId: row.id,
      teamId: row.providerTeamId,
      userId: row.requesterUserId,
      documentType: 'invoice',
      title: 'Service Invoice',
      reference,
      pdfBytes: pdf
    });

    return new Response(pdf, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="service-invoice-${row.id}.pdf"`,
        'x-generated-document-id': String(doc.id)
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

    if (!purchase) return Response.json({ error: 'Not found' }, { status: 404 });
    const team = await getTeamForUser();
    const canAccess = purchase.buyerUserId === user.id || (team && team.id === purchase.teamId);
    if (!canAccess) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const reference = `PR-${purchase.id}`;
    const pdf = await renderPdfWithQuestPdf(
      buildPaymentDocumentPayload({
        template: 'invoice',
        title: 'Business Purchase Invoice',
        reference,
        issuedAtIso: purchase.createdAt?.toISOString?.() ?? new Date().toISOString(),
        gross: asMoney(purchase.totalAmountKobo),
        from: purchase.teamName,
        to: purchase.buyerName || purchase.buyerEmail,
        lineItems: [
          {
            label: 'Purchase request',
            quantity: purchase.quantity,
            unitAmount: asMoney(purchase.agreedUnitPriceKobo),
            totalAmount: asMoney(purchase.totalAmountKobo)
          }
        ]
      })
    );

    const doc = await storeGeneratedPdf({
      sourceKind: 'retail_purchase_request',
      sourceId: purchase.id,
      teamId: purchase.teamId,
      userId: purchase.buyerUserId,
      documentType: 'invoice',
      title: 'Business Purchase Invoice',
      reference,
      pdfBytes: pdf
    });

    return new Response(pdf, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="purchase-invoice-${purchase.id}.pdf"`,
        'x-generated-document-id': String(doc.id)
      }
    });
  }

  return Response.json(
    { error: 'Unsupported invoice type. Use rider-booking, service-request, or purchase-request.' },
    { status: 400 }
  );
}
