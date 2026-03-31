import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { retailPosTransactions } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { createPosTransaction } from '@/lib/retail/engine';
import { posInputSchema, readJson } from '@/app/api/retail/_shared';

export async function GET() {
  try {
    const { team } = await requireRetailContext({ requireInventoryAddon: true });
    const rows = await db
      .select()
      .from(retailPosTransactions)
      .where(eq(retailPosTransactions.teamId, team.id))
      .orderBy(desc(retailPosTransactions.createdAt));
    return Response.json(rows);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { team } = await requireRetailContext({
      ownerWrite: true,
      requireInventoryAddon: true
    });
    const parsed = posInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return Response.json({ error: 'Invalid payload' }, { status: 400 });
    const tx = await createPosTransaction({ teamId: team.id, ...parsed.data });
    return Response.json(tx, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'POS transaction failed' },
      { status: 400 }
    );
  }
}
