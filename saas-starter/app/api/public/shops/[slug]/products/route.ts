import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { retailItems, teams } from '@/lib/db/schema';

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const slug = String((await context.params).slug || '').trim().toLowerCase();
  if (!slug) return Response.json({ error: 'Invalid shop' }, { status: 400 });

  const [shop] = await db
    .select({
      id: teams.id,
      name: teams.name,
      shopSlug: teams.shopSlug,
      businessAddress: teams.businessAddress,
      businessPhone: teams.businessPhone,
      businessWhatsapp: teams.businessWhatsapp,
      businessWebsiteUrl: teams.businessWebsiteUrl,
      businessLat: teams.businessLat,
      businessLng: teams.businessLng
    })
    .from(teams)
    .where(and(eq(teams.shopSlug, slug), eq(teams.isStorefrontPublic, true)))
    .limit(1);
  if (!shop) return Response.json({ error: 'Shop not found' }, { status: 404 });

  const items = await db
    .select({
      id: retailItems.id,
      name: retailItems.name,
      sku: retailItems.sku,
      quantity: retailItems.quantity,
      sellingPriceKobo: retailItems.sellingPriceKobo,
      description: retailItems.description
    })
    .from(retailItems)
    .where(eq(retailItems.teamId, shop.id));

  return Response.json({ shop, items });
}
