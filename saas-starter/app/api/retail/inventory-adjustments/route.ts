import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { retailInventoryAdjustments } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';

export async function GET() {
  try {
    const { team } = await requireRetailContext();
    const rows = await db
      .select()
      .from(retailInventoryAdjustments)
      .where(eq(retailInventoryAdjustments.teamId, team.id))
      .orderBy(desc(retailInventoryAdjustments.createdAt));
    return Response.json(rows);
  } catch (error) {
    return toHttpError(error);
  }
}
