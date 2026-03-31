import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { businessOwnerReviews, teams } from '@/lib/db/schema';
import { isPlatformAdmin } from '@/lib/admin/auth';

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
    .select()
    .from(businessOwnerReviews)
    .innerJoin(teams, eq(businessOwnerReviews.teamId, teams.id))
    .where(whereExpr)
    .orderBy(desc(businessOwnerReviews.createdAt));

  const reviews = rows.map((row) => ({
    ...row.business_owner_reviews,
    teamName: row.teams.name
  }));

  return Response.json({
    reviews,
    filters: { status: status || null, teamId: teamId || null }
  });
}
