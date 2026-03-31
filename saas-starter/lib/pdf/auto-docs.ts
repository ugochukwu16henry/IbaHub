import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  riderBookings,
  serviceRequests,
  teams,
  users
} from '@/lib/db/schema';
import { storeGeneratedPdf } from '@/lib/pdf/document-store';
import { renderPdfWithQuestPdf } from '@/lib/pdf/questpdf-client';
import { buildPaymentDocumentPayload } from '@/lib/pdf/templates';

const toMoney = (kobo: number) => Number((kobo || 0) / 100);

export async function generateDocsForRiderBookingPayment(riderBookingId: number) {
  const [booking] = await db
    .select({
      id: riderBookings.id,
      customerUserId: riderBookings.customerUserId,
      grossAmountKobo: riderBookings.grossAmountKobo,
      platformFeeKobo: riderBookings.platformFeeKobo,
      riderNetKobo: riderBookings.riderNetKobo,
      paystackReference: riderBookings.paystackReference,
      createdAt: riderBookings.createdAt,
      pickupLabel: riderBookings.pickupLabel,
      dropoffLabel: riderBookings.dropoffLabel,
      customerName: users.name,
      customerEmail: users.email
    })
    .from(riderBookings)
    .innerJoin(users, eq(riderBookings.customerUserId, users.id))
    .where(eq(riderBookings.id, riderBookingId))
    .limit(1);

  if (!booking) return null;

  const buyer = booking.customerName || booking.customerEmail;
  const reference = booking.paystackReference || `RIDE-${booking.id}`;
  const issuedAtIso = booking.createdAt?.toISOString?.() ?? new Date().toISOString();
  const lineItems = [
    {
      label: `${booking.pickupLabel} -> ${booking.dropoffLabel}`,
      quantity: 1,
      unitAmount: toMoney(booking.grossAmountKobo),
      totalAmount: toMoney(booking.grossAmountKobo)
    }
  ];

  const receiptBytes = await renderPdfWithQuestPdf(
    buildPaymentDocumentPayload({
      template: 'payment_receipt',
      title: 'Ride Payment Receipt',
      reference,
      issuedAtIso,
      gross: toMoney(booking.grossAmountKobo),
      fee: toMoney(booking.platformFeeKobo),
      net: toMoney(booking.riderNetKobo),
      from: buyer,
      to: 'Rider Partner',
      lineItems,
      notes: 'Auto-generated from payment webhook'
    })
  );

  const invoiceBytes = await renderPdfWithQuestPdf(
    buildPaymentDocumentPayload({
      template: 'invoice',
      title: 'Ride Service Invoice',
      reference,
      issuedAtIso,
      gross: toMoney(booking.grossAmountKobo),
      fee: toMoney(booking.platformFeeKobo),
      net: toMoney(booking.riderNetKobo),
      from: 'IbaHub Transport',
      to: buyer,
      lineItems,
      notes: 'Invoice generated after successful charge'
    })
  );

  const [receipt, invoice] = await Promise.all([
    storeGeneratedPdf({
      sourceKind: 'rider_booking',
      sourceId: booking.id,
      userId: booking.customerUserId,
      documentType: 'receipt',
      title: 'Ride Payment Receipt',
      reference,
      pdfBytes: receiptBytes
    }),
    storeGeneratedPdf({
      sourceKind: 'rider_booking',
      sourceId: booking.id,
      userId: booking.customerUserId,
      documentType: 'invoice',
      title: 'Ride Service Invoice',
      reference,
      pdfBytes: invoiceBytes
    })
  ]);

  return { receiptId: receipt.id, invoiceId: invoice.id };
}

export async function generateDocsForServiceRequestPayment(serviceRequestId: number) {
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
      requesterName: users.name,
      requesterEmail: users.email,
      teamName: teams.name
    })
    .from(serviceRequests)
    .innerJoin(users, eq(serviceRequests.requesterUserId, users.id))
    .innerJoin(teams, eq(serviceRequests.providerTeamId, teams.id))
    .where(eq(serviceRequests.id, serviceRequestId))
    .limit(1);

  if (!row) return null;

  const buyer = row.requesterName || row.requesterEmail;
  const reference = row.paystackReference || `SR-${row.id}`;
  const issuedAtIso = row.createdAt?.toISOString?.() ?? new Date().toISOString();
  const lineItems = [
    {
      label: row.message || 'Service request payment',
      quantity: 1,
      unitAmount: toMoney(row.grossAmountKobo),
      totalAmount: toMoney(row.grossAmountKobo)
    }
  ];

  const receiptBytes = await renderPdfWithQuestPdf(
    buildPaymentDocumentPayload({
      template: 'payment_receipt',
      title: 'Service Payment Receipt',
      reference,
      issuedAtIso,
      gross: toMoney(row.grossAmountKobo),
      fee: toMoney(row.platformFeeKobo),
      net: toMoney(row.providerEarningsKobo),
      from: buyer,
      to: row.teamName,
      lineItems,
      notes: 'Auto-generated from payment webhook'
    })
  );

  const invoiceBytes = await renderPdfWithQuestPdf(
    buildPaymentDocumentPayload({
      template: 'invoice',
      title: 'Service Invoice',
      reference,
      issuedAtIso,
      gross: toMoney(row.grossAmountKobo),
      fee: toMoney(row.platformFeeKobo),
      net: toMoney(row.providerEarningsKobo),
      from: row.teamName,
      to: buyer,
      lineItems,
      notes: 'Invoice generated after successful charge'
    })
  );

  const [receipt, invoice] = await Promise.all([
    storeGeneratedPdf({
      sourceKind: 'service_request',
      sourceId: row.id,
      teamId: row.providerTeamId,
      userId: row.requesterUserId,
      documentType: 'receipt',
      title: 'Service Payment Receipt',
      reference,
      pdfBytes: receiptBytes
    }),
    storeGeneratedPdf({
      sourceKind: 'service_request',
      sourceId: row.id,
      teamId: row.providerTeamId,
      userId: row.requesterUserId,
      documentType: 'invoice',
      title: 'Service Invoice',
      reference,
      pdfBytes: invoiceBytes
    })
  ]);

  return { receiptId: receipt.id, invoiceId: invoice.id };
}

export async function generateInvoiceForTeamSubscription(teamId: number, reference: string, amountKobo: number, planName?: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) return null;

  const invoiceBytes = await renderPdfWithQuestPdf(
    buildPaymentDocumentPayload({
      template: 'invoice',
      title: 'Team Subscription Invoice',
      reference,
      issuedAtIso: new Date().toISOString(),
      gross: toMoney(amountKobo),
      from: 'IbaHub',
      to: team.name,
      lineItems: [
        {
          label: planName || team.planName || 'Subscription plan',
          quantity: 1,
          unitAmount: toMoney(amountKobo),
          totalAmount: toMoney(amountKobo)
        }
      ],
      notes: 'Generated from team subscription payment'
    })
  );

  const invoice = await storeGeneratedPdf({
    sourceKind: 'team_subscription',
    sourceId: team.id,
    teamId: team.id,
    documentType: 'invoice',
    title: 'Team Subscription Invoice',
    reference,
    pdfBytes: invoiceBytes
  });

  return { invoiceId: invoice.id };
}
