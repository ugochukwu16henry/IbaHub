import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  retailInventoryAdjustments,
  retailItems,
  retailOrderItems,
  retailOrders,
  retailPosTransactions
} from '@/lib/db/schema';

type SaleLine = { itemId: number; quantity: number };

function makeOrderNumber(teamId: number) {
  return `ORD-${teamId}-${Date.now()}`;
}

export async function createRetailOrder(opts: {
  teamId: number;
  lines: SaleLine[];
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  discountKobo?: number;
  taxKobo?: number;
}) {
  return db.transaction(async (tx) => {
    let subtotalKobo = 0;
    const rows: Array<{ itemId: number; quantity: number; unitPriceKobo: number; lineTotalKobo: number }> = [];

    for (const line of opts.lines) {
      const [item] = await tx
        .select()
        .from(retailItems)
        .where(and(eq(retailItems.id, line.itemId), eq(retailItems.teamId, opts.teamId)))
        .limit(1);
      if (!item) throw new Error(`Item ${line.itemId} not found`);
      if (line.quantity <= 0) throw new Error('Quantity must be positive');
      if (item.quantity < line.quantity) throw new Error(`Insufficient stock for ${item.name}`);

      const lineTotalKobo = item.sellingPriceKobo * line.quantity;
      subtotalKobo += lineTotalKobo;
      rows.push({
        itemId: item.id,
        quantity: line.quantity,
        unitPriceKobo: item.sellingPriceKobo,
        lineTotalKobo
      });
    }

    const discountKobo = Math.max(0, opts.discountKobo ?? 0);
    const taxKobo = Math.max(0, opts.taxKobo ?? 0);
    const totalKobo = Math.max(0, subtotalKobo - discountKobo + taxKobo);

    const [order] = await tx
      .insert(retailOrders)
      .values({
        teamId: opts.teamId,
        orderNumber: makeOrderNumber(opts.teamId),
        status: 'completed',
        customerName: opts.customerName,
        customerEmail: opts.customerEmail,
        subtotalKobo,
        discountKobo,
        taxKobo,
        totalKobo,
        notes: opts.notes
      })
      .returning();

    for (const row of rows) {
      await tx.insert(retailOrderItems).values({
        teamId: opts.teamId,
        orderId: order.id,
        itemId: row.itemId,
        quantity: row.quantity,
        unitPriceKobo: row.unitPriceKobo,
        lineTotalKobo: row.lineTotalKobo
      });

      const [updated] = await tx.select().from(retailItems).where(eq(retailItems.id, row.itemId)).limit(1);
      await tx
        .update(retailItems)
        .set({ quantity: Math.max(0, (updated?.quantity ?? 0) - row.quantity), updatedAt: new Date() })
        .where(eq(retailItems.id, row.itemId));

      await tx.insert(retailInventoryAdjustments).values({
        teamId: opts.teamId,
        itemId: row.itemId,
        delta: -row.quantity,
        reason: 'sale',
        referenceType: 'order',
        referenceId: String(order.id)
      });
    }

    return order;
  });
}

export async function createPosTransaction(opts: {
  teamId: number;
  idempotencyKey: string;
  paymentMethod: string;
  lines: SaleLine[];
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  discountKobo?: number;
  taxKobo?: number;
}) {
  const [existing] = await db
    .select()
    .from(retailPosTransactions)
    .where(
      and(
        eq(retailPosTransactions.teamId, opts.teamId),
        eq(retailPosTransactions.idempotencyKey, opts.idempotencyKey)
      )
    )
    .limit(1);

  if (existing) return existing;

  const order = await createRetailOrder({
    teamId: opts.teamId,
    lines: opts.lines,
    customerName: opts.customerName,
    customerEmail: opts.customerEmail,
    notes: opts.notes,
    discountKobo: opts.discountKobo,
    taxKobo: opts.taxKobo
  });

  const [pos] = await db
    .insert(retailPosTransactions)
    .values({
      teamId: opts.teamId,
      orderId: order.id,
      idempotencyKey: opts.idempotencyKey,
      status: 'completed',
      amountKobo: order.totalKobo,
      paymentMethod: opts.paymentMethod || 'cash'
    })
    .returning();

  return pos;
}
