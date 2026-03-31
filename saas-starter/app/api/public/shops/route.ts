import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';

export async function GET() {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      shopSlug: teams.shopSlug,
      businessCategory: teams.businessCategory,
      businessAddress: teams.businessAddress
    })
    .from(teams)
    .where(eq(teams.isStorefrontPublic, true))
    .orderBy(desc(teams.updatedAt));

  return Response.json(
    rows.filter((r) => r.shopSlug).map((r) => ({ ...r, shopUrl: `/shops/${r.shopSlug}` }))
  );
}
