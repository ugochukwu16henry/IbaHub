import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { businessOwnerReviews, retailPurchaseRequests } from '@/lib/db/schema';

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const purchaseRequestId = Number(body.purchaseRequestId);
  const rating = Number(body.rating);
  const professionalism = Number(body.professionalism);
  const honesty = Number(body.honesty);
  const quality = Number(body.quality);
  const communication = Number(body.communication);
  const timeliness = Number(body.timeliness);
  const comment = String(body.comment || '').trim();

  if (!purchaseRequestId || ![rating, professionalism, honesty, quality, communication, timeliness].every((v) => v >= 1 && v <= 5)) {
    return Response.json({ error: 'Invalid review payload' }, { status: 400 });
  }

  const [requestRow] = await db
    .select()
    .from(retailPurchaseRequests)
    .where(eq(retailPurchaseRequests.id, purchaseRequestId))
    .limit(1);
  if (!requestRow || requestRow.buyerUserId !== user.id) {
    return Response.json({ error: 'Request not found' }, { status: 404 });
  }
  if (requestRow.status !== 'fulfilled') {
    return Response.json({ error: 'Review allowed only after fulfillment' }, { status: 409 });
  }

  await db
    .insert(businessOwnerReviews)
    .values({
      teamId: requestRow.teamId,
      purchaseRequestId,
      buyerUserId: user.id,
      rating,
      professionalism,
      honesty,
      quality,
      communication,
      timeliness,
      comment: comment || null,
      adminStatus: 'pending'
    })
    .onConflictDoNothing();

  return Response.json({ ok: true });
}

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const team = await getTeamForUser();
  const isOwner = !!team?.teamMembers.find((m) => m.userId === user.id && m.role === 'owner');

  if (isOwner && team) {
    const rows = await db
      .select()
      .from(businessOwnerReviews)
      .where(eq(businessOwnerReviews.teamId, team.id));
    return Response.json({ mode: 'owner', reviews: rows });
  }

  const rows = await db
    .select()
    .from(businessOwnerReviews)
    .where(eq(businessOwnerReviews.buyerUserId, user.id));
  return Response.json({ mode: 'buyer', reviews: rows });
}
