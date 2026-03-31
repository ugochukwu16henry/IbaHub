import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { businessOwnerReviews, retailItems, teams } from '@/lib/db/schema';

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
      businessLng: teams.businessLng,
      storefrontSettings: teams.storefrontSettings
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

  const approvedTestimonials = await db
    .select({
      id: businessOwnerReviews.id,
      rating: businessOwnerReviews.rating,
      professionalism: businessOwnerReviews.professionalism,
      honesty: businessOwnerReviews.honesty,
      quality: businessOwnerReviews.quality,
      communication: businessOwnerReviews.communication,
      timeliness: businessOwnerReviews.timeliness,
      comment: businessOwnerReviews.comment,
      createdAt: businessOwnerReviews.createdAt
    })
    .from(businessOwnerReviews)
    .where(
      and(
        eq(businessOwnerReviews.teamId, shop.id),
        eq(businessOwnerReviews.adminStatus, 'approved')
      )
    );

  const avg = await db
    .select({
      avgRating: sql<number>`coalesce(avg(${businessOwnerReviews.rating}), 0)`,
      total: sql<number>`count(*)`
    })
    .from(businessOwnerReviews)
    .where(
      and(
        eq(businessOwnerReviews.teamId, shop.id),
        eq(businessOwnerReviews.adminStatus, 'approved')
      )
    );

  return Response.json({
    shop,
    items,
    testimonials: approvedTestimonials,
    summary: {
      averageRating: Number(avg[0]?.avgRating || 0),
      totalTestimonials: Number(avg[0]?.total || 0)
    }
  });
}
