import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { retailOrderItems, retailOrders } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { createRetailOrder } from '@/lib/retail/engine';
import { readJson } from '@/app/api/retail/_shared';

const createSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  notes: z.string().optional(),
  discountKobo: z.number().int().min(0).optional(),
  taxKobo: z.number().int().min(0).optional(),
  lines: z.array(z.object({ itemId: z.number().int().positive(), quantity: z.number().int().positive() })).min(1)
});

export async function GET() {
  try {
    const { team } = await requireRetailContext({ requireInventoryAddon: true });
    const rows = await db
      .select()
      .from(retailOrders)
      .where(eq(retailOrders.teamId, team.id))
      .orderBy(desc(retailOrders.createdAt));
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
    const parsed = createSchema.safeParse(await readJson(request));
    if (!parsed.success) return Response.json({ error: 'Invalid payload' }, { status: 400 });

    const order = await createRetailOrder({ teamId: team.id, ...parsed.data });
    const lines = await db
      .select()
      .from(retailOrderItems)
      .where(and(eq(retailOrderItems.teamId, team.id), eq(retailOrderItems.orderId, order.id)));
    return Response.json({ order, lines }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Order creation failed' },
      { status: 400 }
    );
  }
}
