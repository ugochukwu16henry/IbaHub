'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import {
  providerProfiles,
  serviceListings,
  serviceRequests,
  serviceReviews,
  teamMembers,
} from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { initializePaystackTransaction } from '@/lib/payments/paystack-marketplace';

function toKobo(amountNaira: string) {
  const parsed = Number(amountNaira);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('Price must be a valid number');
  }
  return Math.round(parsed * 100);
}

function calculateCommission(grossAmountKobo: number) {
  const platformFeeKobo = Math.round(grossAmountKobo * 0.05);
  const providerEarningsKobo = Math.max(grossAmountKobo - platformFeeKobo, 0);
  return { platformFeeKobo, providerEarningsKobo };
}

async function assertOrgOwner() {
  const user = await getUser();
  const team = await getTeamForUser();
  if (!user || !team) throw new Error('Unauthorized');

  const member = team.teamMembers.find((m) => m.userId === user.id);
  if (!member || member.role !== 'owner') {
    throw new Error('Only organization owners can perform this action');
  }

  return { user, team };
}

export async function upsertProviderProfileAction(formData: FormData) {
  const { team } = await assertOrgOwner();

  const displayName = String(formData.get('displayName') || '').trim();
  const bio = String(formData.get('bio') || '').trim();
  const contactPhone = String(formData.get('contactPhone') || '').trim();
  const contactWhatsapp = String(formData.get('contactWhatsapp') || '').trim();

  if (!displayName) throw new Error('Display name is required');

  await db
    .insert(providerProfiles)
    .values({
      teamId: team.id,
      displayName,
      bio: bio || null,
      contactPhone: contactPhone || null,
      contactWhatsapp: contactWhatsapp || null,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: providerProfiles.teamId,
      set: {
        displayName,
        bio: bio || null,
        contactPhone: contactPhone || null,
        contactWhatsapp: contactWhatsapp || null,
        updatedAt: new Date(),
      },
    });

  revalidatePath('/dashboard/marketplace');
}

export async function createServiceListingAction(formData: FormData) {
  const { team } = await assertOrgOwner();

  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const pricingType = String(formData.get('pricingType') || 'fixed').trim();
  const availability = String(formData.get('availability') || '').trim();
  const priceNaira = String(formData.get('priceNaira') || '').trim();

  if (!title || !category) throw new Error('Title and category are required');

  await db.insert(serviceListings).values({
    teamId: team.id,
    title,
    category,
    description: description || null,
    pricingType: pricingType || 'fixed',
    availability: availability || null,
    priceKobo: toKobo(priceNaira),
    isActive: true,
  });

  revalidatePath('/dashboard/marketplace');
}

export async function createServiceRequestAction(formData: FormData) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const listingId = Number(formData.get('listingId'));
  const providerTeamId = Number(formData.get('providerTeamId'));
  const message = String(formData.get('message') || '').trim();
  const contactPhone = String(formData.get('contactPhone') || '').trim();

  if (!listingId || !providerTeamId) throw new Error('Invalid service selected');

  const [listing] = await db
    .select({
      id: serviceListings.id,
      priceKobo: serviceListings.priceKobo,
    })
    .from(serviceListings)
    .where(and(eq(serviceListings.id, listingId), eq(serviceListings.isActive, true)))
    .limit(1);

  if (!listing) throw new Error('Selected service is not available');
  const grossAmountKobo = listing.priceKobo;
  const { platformFeeKobo, providerEarningsKobo } =
    calculateCommission(grossAmountKobo);

  await db.insert(serviceRequests).values({
    listingId,
    providerTeamId,
    requesterUserId: user.id,
    message: message || null,
    contactPhone: contactPhone || null,
    status: 'requested',
    paymentStatus: 'unpaid',
    grossAmountKobo,
    platformFeeKobo,
    providerEarningsKobo,
  });

  revalidatePath('/dashboard/marketplace');
}

export async function markServiceRequestPaidAction(formData: FormData) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const requestId = Number(formData.get('requestId'));
  if (!requestId) throw new Error('Invalid request');

  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!request || request.requesterUserId !== user.id) {
    throw new Error('Request not found');
  }
  if (request.paymentStatus === 'paid') {
    revalidatePath('/dashboard/marketplace');
    return;
  }

  const reference = `svc_req_${request.id}_${Date.now()}`;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/dashboard/marketplace?payment=callback`;
  const tx = await initializePaystackTransaction({
    email: user.email,
    amountKobo: request.grossAmountKobo,
    reference,
    callbackUrl,
    metadata: {
      serviceRequestId: request.id,
      providerTeamId: request.providerTeamId,
      platformFeeKobo: request.platformFeeKobo,
      providerEarningsKobo: request.providerEarningsKobo,
    },
  });

  await db
    .update(serviceRequests)
    .set({
      paystackReference: tx.reference,
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId));

  redirect(tx.authorization_url);
}

export async function updateServiceRequestStatusAction(formData: FormData) {
  const { team } = await assertOrgOwner();
  const requestId = Number(formData.get('requestId'));
  const status = String(formData.get('status') || '').trim();

  if (!requestId) throw new Error('Invalid request');
  if (!['accepted', 'in_progress', 'completed'].includes(status)) {
    throw new Error('Invalid status');
  }

  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(
      and(eq(serviceRequests.id, requestId), eq(serviceRequests.providerTeamId, team.id))
    )
    .limit(1);

  if (!request) throw new Error('Request not found');

  if (status === 'in_progress' && request.paymentStatus !== 'paid') {
    throw new Error('Customer payment must be confirmed before work starts');
  }

  if (status === 'completed') {
    await db
      .update(serviceRequests)
      .set({
        status: 'awaiting_confirmation',
        providerCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, requestId));

    revalidatePath('/dashboard/marketplace');
    return;
  }

  await db
    .update(serviceRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(serviceRequests.id, requestId));

  revalidatePath('/dashboard/marketplace');
}

export async function submitServiceReviewAction(formData: FormData) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const requestId = Number(formData.get('requestId'));
  const rating = Number(formData.get('rating'));
  const comment = String(formData.get('comment') || '').trim();

  if (!requestId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be from 1 to 5');
  }

  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!request || request.requesterUserId !== user.id || request.status !== 'completed') {
    throw new Error('You can only review completed requests you made');
  }

  await db
    .insert(serviceReviews)
    .values({
      requestId,
      reviewerUserId: user.id,
      rating,
      comment: comment || null,
    })
    .onConflictDoNothing();

  revalidatePath('/dashboard/marketplace');
}

export async function confirmServiceCompletionAction(formData: FormData) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const requestId = Number(formData.get('requestId'));
  if (!requestId) throw new Error('Invalid request');

  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!request || request.requesterUserId !== user.id) {
    throw new Error('Request not found');
  }
  if (request.paymentStatus !== 'paid') {
    throw new Error('Payment must be confirmed first');
  }
  if (request.status !== 'awaiting_confirmation') {
    throw new Error('Provider has not marked this service as completed yet');
  }

  await db
    .update(serviceRequests)
    .set({
      status: 'completed',
      customerConfirmedAt: new Date(),
      payoutStatus: 'ready_for_payout',
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId));

  revalidatePath('/dashboard/marketplace');
}

export async function toggleListingActiveAction(formData: FormData) {
  const { team } = await assertOrgOwner();
  const listingId = Number(formData.get('listingId'));
  const makeActive = String(formData.get('makeActive') || 'false') === 'true';
  if (!listingId) throw new Error('Invalid listing');

  const [listing] = await db
    .select()
    .from(serviceListings)
    .where(and(eq(serviceListings.id, listingId), eq(serviceListings.teamId, team.id)))
    .limit(1);

  if (!listing) throw new Error('Listing not found');

  await db
    .update(serviceListings)
    .set({ isActive: makeActive, updatedAt: new Date() })
    .where(eq(serviceListings.id, listingId));

  revalidatePath('/dashboard/marketplace');
}
