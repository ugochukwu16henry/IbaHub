import { and, desc, eq } from 'drizzle-orm';
import { isPlatformAdmin } from '@/lib/admin/auth';
import { toCsv } from '@/lib/admin/csv';
import { db } from '@/lib/db/drizzle';
import { businessOwnerReviews, teams, users } from '@/lib/db/schema';

export async function GET(request: Request) {
  const allowed = await isPlatformAdmin();
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const status = (url.searchParams.get('status') || '').trim();
  const teamId = Number(url.searchParams.get('teamId') || 0);

  const whereExpr =
    status && teamId > 0
      ? and(eq(businessOwnerReviews.adminStatus, status), eq(businessOwnerReviews.teamId, teamId))
      : status
      ? eq(businessOwnerReviews.adminStatus, status)
      : teamId > 0
      ? eq(businessOwnerReviews.teamId, teamId)
      : undefined;

  const rows = await db
    .select({
      id: businessOwnerReviews.id,
      teamId: businessOwnerReviews.teamId,
      teamName: teams.name,
      buyerUserId: businessOwnerReviews.buyerUserId,
      buyerEmail: users.email,
      purchaseRequestId: businessOwnerReviews.purchaseRequestId,
      rating: businessOwnerReviews.rating,
      professionalism: businessOwnerReviews.professionalism,
      honesty: businessOwnerReviews.honesty,
      quality: businessOwnerReviews.quality,
      communication: businessOwnerReviews.communication,
      timeliness: businessOwnerReviews.timeliness,
      adminStatus: businessOwnerReviews.adminStatus,
      comment: businessOwnerReviews.comment,
      createdAt: businessOwnerReviews.createdAt,
      approvedAt: businessOwnerReviews.approvedAt
    })
    .from(businessOwnerReviews)
    .innerJoin(teams, eq(businessOwnerReviews.teamId, teams.id))
    .innerJoin(users, eq(businessOwnerReviews.buyerUserId, users.id))
    .where(whereExpr)
    .orderBy(desc(businessOwnerReviews.createdAt));

  const headers = [
    'review_id',
    'team_id',
    'team_name',
    'buyer_user_id',
    'buyer_email',
    'purchase_request_id',
    'rating',
    'professionalism',
    'honesty',
    'quality',
    'communication',
    'timeliness',
    'admin_status',
    'comment',
    'created_at',
    'approved_at'
  ];

  const csv = toCsv(
    headers,
    rows.map((r) => [
      r.id,
      r.teamId,
      r.teamName,
      r.buyerUserId,
      r.buyerEmail,
      r.purchaseRequestId,
      r.rating,
      r.professionalism,
      r.honesty,
      r.quality,
      r.communication,
      r.timeliness,
      r.adminStatus,
      r.comment || '',
      r.createdAt?.toISOString?.() || '',
      r.approvedAt?.toISOString?.() || ''
    ])
  );

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="business-reviews.csv"`
    }
  });
}
