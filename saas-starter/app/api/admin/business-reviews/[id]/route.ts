import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { businessOwnerReviews } from '@/lib/db/schema';
import { isPlatformAdmin } from '@/lib/admin/auth';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const allowed = await isPlatformAdmin();
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number((await context.params).id);
  const body = (await request.json()) as { adminStatus?: string; adminDecisionNote?: string };
  const nextStatus = body.adminStatus;
  if (!id || !['approved', 'rejected'].includes(String(nextStatus || ''))) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const [updated] = await db
    .update(businessOwnerReviews)
    .set({
      adminStatus: String(nextStatus),
      adminDecisionNote: body.adminDecisionNote || null,
      approvedByUserId: user.id,
      approvedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(businessOwnerReviews.id, id))
    .returning();
  if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ review: updated });
}
