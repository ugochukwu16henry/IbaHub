import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { retailItems } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { itemInputSchema, readJson, toKobo } from '@/app/api/retail/_shared';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { team } = await requireRetailContext();
    const items = await db
      .select()
      .from(retailItems)
      .where(eq(retailItems.teamId, team.id))
      .orderBy(desc(retailItems.createdAt));
    return Response.json(items);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const body = await readJson(request);
    const parsed = itemInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });
    }
    const payload = parsed.data;

    const [existing] = await db
      .select()
      .from(retailItems)
      .where(and(eq(retailItems.teamId, team.id), eq(retailItems.sku, payload.sku)))
      .limit(1);
    if (existing) return Response.json({ error: 'SKU already exists' }, { status: 409 });

    const [item] = await db
      .insert(retailItems)
      .values({
        teamId: team.id,
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
        purchasePriceKobo: toKobo(payload.purchasePriceNaira),
        sellingPriceKobo: toKobo(payload.sellingPriceNaira)
      })
      .returning();

    return Response.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    return toHttpError(error);
  }
}
