'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { withTeam } from '@/lib/auth/middleware';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import {
  retailBrands,
  retailCategories,
  retailItems,
  retailPurchaseRequests,
  retailUnits,
  retailWarehouses,
  teams
} from '@/lib/db/schema';

async function ensureOwner(team: { teamMembers: Array<{ userId: number; role: string }> }) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');
  const member = team.teamMembers.find((m) => m.userId === user.id);
  if (member?.role !== 'owner') throw new Error('Only owners can perform this action');
}

async function ensureRetailDefaults(teamId: number) {
  const [warehouse] = await db
    .select()
    .from(retailWarehouses)
    .where(eq(retailWarehouses.teamId, teamId))
    .limit(1);

  if (!warehouse) {
    await db.insert(retailWarehouses).values({
      teamId,
      name: 'Main Warehouse',
      address: 'Head Office'
    });
  }

  const units = await db.select().from(retailUnits).where(eq(retailUnits.teamId, teamId));
  if (units.length === 0) {
    await db.insert(retailUnits).values([
      { teamId, name: 'Piece', abbreviation: 'pcs' },
      { teamId, name: 'Pack', abbreviation: 'pk' },
      { teamId, name: 'Kilogram', abbreviation: 'kg' }
    ]);
  }
}

export const saveBusinessProfileAction = withTeam(async (formData, team) => {
  await ensureOwner(team);

  const businessName = String(formData.get('businessName') || '').trim();
  const businessPhone = String(formData.get('businessPhone') || '').trim();
  const businessWhatsapp = String(formData.get('businessWhatsapp') || '').trim();
  const businessAddress = String(formData.get('businessAddress') || '').trim();
  const businessLatRaw = Number(formData.get('businessLat') || 0);
  const businessLngRaw = Number(formData.get('businessLng') || 0);
  const businessCategory = String(formData.get('businessCategory') || '').trim();
  const shopSlugRaw = String(formData.get('shopSlug') || '').trim().toLowerCase();
  const isStorefrontPublic =
    String(formData.get('isStorefrontPublic') || 'false').trim() === 'true';

  if (!businessName || !businessPhone || !businessCategory) {
    throw new Error('Business name, phone, and category are required.');
  }

  const slug = shopSlugRaw
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) throw new Error('Valid shop slug is required.');

  const [conflict] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.shopSlug, slug), ne(teams.id, team.id)))
    .limit(1);
  if (conflict && conflict.id !== team.id) {
    throw new Error('Shop slug is already in use.');
  }

  await db
    .update(teams)
    .set({
      name: businessName,
      businessPhone,
      businessWhatsapp: businessWhatsapp || null,
      businessAddress: businessAddress || null,
      businessLat:
        Number.isFinite(businessLatRaw) && businessLatRaw !== 0
          ? Math.round(businessLatRaw * 1_000_000)
          : null,
      businessLng:
        Number.isFinite(businessLngRaw) && businessLngRaw !== 0
          ? Math.round(businessLngRaw * 1_000_000)
          : null,
      businessCategory,
      shopSlug: slug,
      isStorefrontPublic,
      businessProfileCompleted: true,
      updatedAt: new Date()
    })
    .where(eq(teams.id, team.id));

  await ensureRetailDefaults(team.id);
  revalidatePath('/dashboard/hub/retail');
});

export const updatePurchaseRequestStatusAction = withTeam(async (formData, team) => {
  await ensureOwner(team);
  const requestId = Number(formData.get('requestId'));
  const status = String(formData.get('status') || '').trim();
  if (!requestId || !['accepted', 'rejected', 'paid', 'fulfilled'].includes(status)) {
    throw new Error('Invalid request status update.');
  }

  await db
    .update(retailPurchaseRequests)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(retailPurchaseRequests.id, requestId), eq(retailPurchaseRequests.teamId, team.id)));

  revalidatePath('/dashboard/hub/retail/purchase-requests');
});

export const createFirstProductAction = withTeam(async (formData, team) => {
  await ensureOwner(team);
  if (team.subscriptionStatus !== 'active') {
    throw new Error('Active subscription required');
  }

  await ensureRetailDefaults(team.id);

  const name = String(formData.get('name') || '').trim();
  const sku = String(formData.get('sku') || '').trim();
  const quantity = Math.max(0, Number(formData.get('quantity') || 0));
  const purchasePriceNaira = Math.max(0, Number(formData.get('purchasePriceNaira') || 0));
  const sellingPriceNaira = Math.max(0, Number(formData.get('sellingPriceNaira') || 0));

  if (!name || !sku || sellingPriceNaira <= 0) {
    throw new Error('Name, SKU and selling price are required.');
  }

  const [warehouse] = await db
    .select()
    .from(retailWarehouses)
    .where(eq(retailWarehouses.teamId, team.id))
    .limit(1);

  let [category] = await db
    .select()
    .from(retailCategories)
    .where(and(eq(retailCategories.teamId, team.id), eq(retailCategories.name, 'General')))
    .limit(1);
  if (!category) {
    [category] = await db
      .insert(retailCategories)
      .values({ teamId: team.id, name: 'General', description: 'Default category' })
      .returning();
  }

  let [brand] = await db
    .select()
    .from(retailBrands)
    .where(and(eq(retailBrands.teamId, team.id), eq(retailBrands.name, 'Generic')))
    .limit(1);
  if (!brand) {
    [brand] = await db
      .insert(retailBrands)
      .values({ teamId: team.id, name: 'Generic' })
      .returning();
  }

  const [unit] = await db
    .select()
    .from(retailUnits)
    .where(eq(retailUnits.teamId, team.id))
    .limit(1);

  await db.insert(retailItems).values({
    teamId: team.id,
    name,
    sku,
    quantity: Math.round(quantity),
    reorderPoint: 5,
    purchasePriceKobo: Math.round(purchasePriceNaira * 100),
    sellingPriceKobo: Math.round(sellingPriceNaira * 100),
    categoryId: category?.id,
    brandId: brand?.id,
    unitId: unit?.id,
    warehouseId: warehouse?.id
  });

  revalidatePath('/dashboard/hub/retail');
});
