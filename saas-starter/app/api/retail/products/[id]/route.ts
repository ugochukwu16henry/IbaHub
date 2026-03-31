import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { retailItems } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { itemInputSchema, parseId, readJson, toKobo } from '@/app/api/retail/_shared';

export const runtime = 'nodejs';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext();
    const { id } = await context.params;
    const itemId = parseId(id);
    const [item] = await db
      .select()
      .from(retailItems)
      .where(and(eq(retailItems.id, itemId), eq(retailItems.teamId, team.id)))
      .limit(1);
    if (!item) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_ID') {
      return Response.json({ error: 'Invalid id' }, { status: 400 });
    }
    return toHttpError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const { id } = await context.params;
    const itemId = parseId(id);
    const body = await readJson(request);
    const parsed = itemInputSchema.partial().safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });
    }
    const payload = parsed.data;

    const [updated] = await db
      .update(retailItems)
      .set({
        name: payload.name,
        sku: payload.sku,
        description: payload.description,
        barcode: payload.barcode,
        categoryId: payload.categoryId,
        brandId: payload.brandId,
        unitId: payload.unitId,
        warehouseId: payload.warehouseId,
        quantity: payload.quantity,
        reorderPoint: payload.reorderPoint,
        images: payload.images ? JSON.stringify(payload.images) : undefined,
        details: payload.details ? JSON.stringify(payload.details) : undefined,
        variants: payload.variants ? JSON.stringify(payload.variants) : undefined,
        purchasePriceKobo:
          typeof payload.purchasePriceNaira === 'number' ? toKobo(payload.purchasePriceNaira) : undefined,
        sellingPriceKobo:
          typeof payload.sellingPriceNaira === 'number' ? toKobo(payload.sellingPriceNaira) : undefined,
        updatedAt: new Date()
      })
      .where(and(eq(retailItems.id, itemId), eq(retailItems.teamId, team.id)))
      .returning();

    if (!updated) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof Error && (error.message === 'INVALID_ID' || error.message === 'INVALID_JSON')) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    return toHttpError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const { id } = await context.params;
    const itemId = parseId(id);
    await db.delete(retailItems).where(and(eq(retailItems.id, itemId), eq(retailItems.teamId, team.id)));
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_ID') {
      return Response.json({ error: 'Invalid id' }, { status: 400 });
    }
    return toHttpError(error);
  }
}
