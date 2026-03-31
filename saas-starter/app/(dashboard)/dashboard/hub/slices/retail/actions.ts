'use server';

import { revalidatePath } from 'next/cache';
import { withTeam } from '@/lib/auth/middleware';
import { getUser } from '@/lib/db/queries';
import { gatewayFetch } from '@/lib/integration/server-gateway';

function ensureActiveSubscription(team: { subscriptionStatus: string | null }) {
  if (team.subscriptionStatus !== 'active') {
    throw new Error('Active subscription required for retail management.');
  }
}

async function ensureOwner(team: {
  teamMembers: Array<{ userId: number; role: string }>;
}) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const membership = team.teamMembers.find((m) => m.userId === user.id);
  if (membership?.role !== 'owner') {
    throw new Error('Organization owner access required.');
  }
}

export const createRetailProductAction = withTeam(async (formData, team) => {
  ensureActiveSubscription(team);
  await ensureOwner(team);

  const name = String(formData.get('name') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const brand = String(formData.get('brand') || '').trim();
  const sku = String(formData.get('sku') || '').trim();
  const quantity = Number(formData.get('quantity') || 0);
  const purchasePrice = Number(formData.get('purchasePrice') || 0);
  const sellingPrice = Number(formData.get('sellingPrice') || 0);

  if (!name || !category || !brand || !sku || sellingPrice <= 0 || purchasePrice <= 0) {
    throw new Error('Fill all required product fields.');
  }

  const res = await gatewayFetch('retail', 'api/products', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name,
      category,
      brand,
      sku,
      quantity: Number.isFinite(quantity) ? Math.max(0, quantity) : 0,
      purchasePrice,
      sellingPrice
    })
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Retail upstream create failed: ${res.status} ${message}`);
  }

  revalidatePath('/dashboard/hub/slices/retail');
});

export const updateRetailStockAction = withTeam(async (formData, team) => {
  ensureActiveSubscription(team);
  await ensureOwner(team);

  const id = Number(formData.get('id'));
  const quantity = Number(formData.get('quantity'));

  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(quantity) || quantity < 0) {
    throw new Error('Invalid item id or quantity.');
  }

  const res = await gatewayFetch('retail', `api/inventory/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ quantity: Math.round(quantity) })
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Retail upstream stock update failed: ${res.status} ${message}`);
  }

  revalidatePath('/dashboard/hub/slices/retail');
});
