import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { retailOrderItems, retailOrders } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { parseId, readJson } from '@/app/api/retail/_shared';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({ requireInventoryAddon: true });
    const id = parseId((await context.params).id);
    const [order] = await db
      .select()
      .from(retailOrders)
      .where(and(eq(retailOrders.id, id), eq(retailOrders.teamId, team.id)))
      .limit(1);
    if (!order) return Response.json({ error: 'Not found' }, { status: 404 });
    const lines = await db
      .select()
      .from(retailOrderItems)
      .where(and(eq(retailOrderItems.orderId, id), eq(retailOrderItems.teamId, team.id)));
    return Response.json({ order, lines });
  } catch (error) {
    return toHttpError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({
      ownerWrite: true,
      requireInventoryAddon: true
    });
    const id = parseId((await context.params).id);
    const body = (await readJson(request)) as { status?: string; notes?: string };
    const [order] = await db
      .update(retailOrders)
      .set({ status: body.status, notes: body.notes, updatedAt: new Date() })
      .where(and(eq(retailOrders.id, id), eq(retailOrders.teamId, team.id)))
      .returning();
    if (!order) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(order);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({
      ownerWrite: true,
      requireInventoryAddon: true
    });
    const id = parseId((await context.params).id);
    await db.delete(retailOrderItems).where(and(eq(retailOrderItems.orderId, id), eq(retailOrderItems.teamId, team.id)));
    await db.delete(retailOrders).where(and(eq(retailOrders.id, id), eq(retailOrders.teamId, team.id)));
    return Response.json({ success: true });
  } catch (error) {
    return toHttpError(error);
  }
}
