import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { retailItems, retailPurchaseRequests, teams } from '@/lib/db/schema';

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const slug = String(body.shopSlug || '').trim().toLowerCase();
  const itemId = Number(body.itemId);
  const quantity = Math.max(1, Number(body.quantity || 1));
  const paymentTerms = String(body.paymentTerms || 'agreed_with_owner').trim();
  const needsDelivery = Boolean(body.needsDelivery);
  const deliveryFrom = String(body.deliveryFrom || 'shop').trim();
  const deliveryAddress = String(body.deliveryAddress || '').trim();
  const notes = String(body.notes || '').trim();

  if (!slug || !itemId) return Response.json({ error: 'Invalid request payload' }, { status: 400 });

  const [shop] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.shopSlug, slug), eq(teams.isStorefrontPublic, true)))
    .limit(1);
  if (!shop) return Response.json({ error: 'Shop not found' }, { status: 404 });

  const [item] = await db
    .select()
    .from(retailItems)
    .where(and(eq(retailItems.id, itemId), eq(retailItems.teamId, shop.id)))
    .limit(1);
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const agreedUnitPriceKobo = item.sellingPriceKobo;
  const totalAmountKobo = agreedUnitPriceKobo * quantity;

  const [created] = await db
    .insert(retailPurchaseRequests)
    .values({
      teamId: shop.id,
      buyerUserId: user.id,
      itemId: item.id,
      quantity,
      agreedUnitPriceKobo,
      totalAmountKobo,
      paymentTerms,
      needsDelivery,
      deliveryFrom: deliveryFrom === 'home' ? 'home' : 'shop',
      deliveryAddress: deliveryAddress || null,
      notes: notes || null,
      status: 'requested'
    })
    .returning();

  return Response.json({ request: created }, { status: 201 });
}
