import Link from 'next/link';
import { getTeamForUser } from '@/lib/db/queries';
import { gatewayFetch } from '@/lib/integration/server-gateway';
import { getValidatedIntegrationBaseUrl } from '@/lib/integration/boundaries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { createRetailProductAction, updateRetailStockAction } from './actions';

type RetailItem = {
  id: number;
  name?: string;
  category?: string;
  brand?: string;
  sku?: string;
  quantity?: number;
  sellingPrice?: number;
  reorderPoint?: number;
};

function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return 'Not available yet';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available yet';
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(date);
}

async function fetchRetailItems() {
  const productsRes = await gatewayFetch('retail', 'api/products');
  if (productsRes.ok) {
    const data = await productsRes.json();
    return Array.isArray(data) ? (data as RetailItem[]) : [];
  }

  const invRes = await gatewayFetch('retail', 'api/inventory');
  if (!invRes.ok) return [];
  const invData = await invRes.json();
  return Array.isArray(invData) ? (invData as RetailItem[]) : [];
}

export default async function RetailSlicePage() {
  const team = await getTeamForUser();
  const validated = getValidatedIntegrationBaseUrl('retail');

  if (!team) {
    return null;
  }

  const canUseRetail = team.subscriptionStatus === 'active';
  const items = validated.ok && canUseRetail ? await fetchRetailItems() : [];
  const totalSku = items.length;
  const totalUnits = items.reduce(
    (sum, item) => sum + (Number.isFinite(item.quantity) ? Number(item.quantity) : 0),
    0
  );
  const stockValue = items.reduce((sum, item) => {
    const qty = Number.isFinite(item.quantity) ? Number(item.quantity) : 0;
    const price = Number.isFinite(item.sellingPrice) ? Number(item.sellingPrice) : 0;
    return sum + qty * price;
  }, 0);
  const lowStockCount = items.filter((item) => {
    const qty = Number.isFinite(item.quantity) ? Number(item.quantity) : 0;
    const reorder = Number.isFinite(item.reorderPoint) ? Number(item.reorderPoint) : 5;
    return qty <= reorder;
  }).length;

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-5xl space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link href="/dashboard/hub">
          <ArrowLeft className="size-4 mr-1" />
          Integration hub
        </Link>
      </Button>

      <h1 className="text-lg lg:text-2xl font-medium">Retail owner workspace</h1>
      <p className="text-sm text-muted-foreground">
        QUANTUM-STASH integration for products and stock updates through IbaHub gateway.
      </p>
      <div>
        <Button asChild>
          <Link href="/dashboard/hub/retail">Open full retail parity modules</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Merchant billing status</CardTitle>
          <CardDescription>
            Organization retail access and subscription health for this merchant.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-medium">{team.planName || 'Not set'}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Subscription</p>
            <p className="font-medium">{team.subscriptionStatus || 'inactive'}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Organization members</p>
            <p className="font-medium">{team.teamMembers.length}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Next renewal</p>
            <p className="font-medium">{formatDate(team.subscriptionRenewsAt)}</p>
          </div>
          <div className="rounded-md border p-3 md:col-span-2">
            <p className="text-xs text-muted-foreground">Last payment reference</p>
            <p className="font-medium">
              {team.lastPaystackPaymentReference || 'Not available yet'}
            </p>
          </div>
        </CardContent>
      </Card>

      {!validated.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Retail backend not configured</CardTitle>
            <CardDescription>
              Set `INTEGRATION_RETAIL_URL` to your running QUANTUM-STASH backend URL.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {validated.ok && !canUseRetail ? (
        <Card>
          <CardHeader>
            <CardTitle>Billing gate</CardTitle>
            <CardDescription>
              Retail management is available for active paid organizations only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/pricing">Activate subscription</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {validated.ok && canUseRetail ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Sales / POS snapshot</CardTitle>
              <CardDescription>
                Live inventory-derived snapshot from QUANTUM-STASH retail data.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">SKUs</p>
                <p className="text-lg font-semibold">{totalSku}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Units in stock</p>
                <p className="text-lg font-semibold">{totalUnits}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Inventory sale value</p>
                <p className="text-lg font-semibold">{formatNaira(stockValue)}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Low stock items</p>
                <p className="text-lg font-semibold">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create product</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createRetailProductAction} className="grid md:grid-cols-3 gap-2">
                <input
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  name="name"
                  placeholder="Product name"
                  required
                />
                <input
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  name="category"
                  placeholder="Category"
                  required
                />
                <input
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  name="brand"
                  placeholder="Brand"
                  required
                />
                <input
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  name="sku"
                  placeholder="SKU"
                  required
                />
                <input
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  name="quantity"
                  type="number"
                  min={0}
                  placeholder="Qty"
                  defaultValue={0}
                  required
                />
                <input
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  name="purchasePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Purchase price"
                  required
                />
                <input
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
                  name="sellingPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Selling price"
                  required
                />
                <div className="md:col-span-3">
                  <button className="rounded-md bg-orange-500 px-4 py-2 text-white text-sm hover:bg-orange-600">
                    Create product
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory list</CardTitle>
              <CardDescription>
                Update stock quantity inline. Changes are sent to QUANTUM-STASH `/api/inventory/:id`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products found from retail backend.</p>
              ) : (
                items.map((item) => (
                  <form
                    key={item.id}
                    action={updateRetailStockAction}
                    className="border rounded-lg p-3 flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="id" value={item.id} />
                    <div className="min-w-[220px]">
                      <p className="font-medium text-sm">{item.name || `Item #${item.id}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.category || '-'} • {item.brand || '-'} • SKU: {item.sku || '-'}
                      </p>
                    </div>
                    <input
                      name="quantity"
                      type="number"
                      min={0}
                      defaultValue={item.quantity ?? 0}
                      className="w-24 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                    />
                    <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
                      Update stock
                    </button>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Sell: {typeof item.sellingPrice === 'number' ? item.sellingPrice : '-'}
                    </span>
                  </form>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
}
