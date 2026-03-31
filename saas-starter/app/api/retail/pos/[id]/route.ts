import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { retailPosTransactions } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { parseId, readJson } from '@/app/api/retail/_shared';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext();
    const id = parseId((await context.params).id);
    const [row] = await db
      .select()
      .from(retailPosTransactions)
      .where(and(eq(retailPosTransactions.id, id), eq(retailPosTransactions.teamId, team.id)))
      .limit(1);
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(row);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const id = parseId((await context.params).id);
    const body = (await readJson(request)) as { status?: string; paymentMethod?: string };
    const [row] = await db
      .update(retailPosTransactions)
      .set({ status: body.status, paymentMethod: body.paymentMethod, updatedAt: new Date() })
      .where(and(eq(retailPosTransactions.id, id), eq(retailPosTransactions.teamId, team.id)))
      .returning();
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(row);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const id = parseId((await context.params).id);
    await db
      .delete(retailPosTransactions)
      .where(and(eq(retailPosTransactions.id, id), eq(retailPosTransactions.teamId, team.id)));
    return Response.json({ success: true });
  } catch (error) {
    return toHttpError(error);
  }
}
