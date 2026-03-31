import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { retailPurchaseRequests } from '@/lib/db/schema';

export async function GET() {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db
    .select()
    .from(retailPurchaseRequests)
    .where(eq(retailPurchaseRequests.buyerUserId, user.id))
    .orderBy(desc(retailPurchaseRequests.createdAt));
  return Response.json({ requests: rows });
}
