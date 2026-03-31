import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  retailBrands,
  retailCategories,
  retailItems,
  retailOrders,
  retailPosTransactions,
  retailUnits,
  retailWarehouses
} from '@/lib/db/schema';
import { requireRetailContext } from '@/lib/retail/auth';
import { saveBusinessProfileAction, createFirstProductAction } from './actions';
import { BusinessLocationPicker } from '@/components/retail/business-location-picker';

export default async function RetailOverviewPage() {
  const { team } = await requireRetailContext();
  const [items, categories, brands, units, warehouses, orders, pos] = await Promise.all([
    db.select().from(retailItems).where(eq(retailItems.teamId, team.id)),
    db.select().from(retailCategories).where(eq(retailCategories.teamId, team.id)),
    db.select().from(retailBrands).where(eq(retailBrands.teamId, team.id)),
    db.select().from(retailUnits).where(eq(retailUnits.teamId, team.id)),
    db.select().from(retailWarehouses).where(eq(retailWarehouses.teamId, team.id)),
    db.select().from(retailOrders).where(eq(retailOrders.teamId, team.id)),
    db.select().from(retailPosTransactions).where(eq(retailPosTransactions.teamId, team.id))
  ]);
  const needsBusinessProfile = !team.businessProfileCompleted;
  const canRunFirstProductWizard =
    team.subscriptionStatus === 'active' && team.businessProfileCompleted && items.length === 0;

  return (
    <div className="space-y-4">
      {needsBusinessProfile ? (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-1">Create business profile</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Set your business details to unlock inventory onboarding.
          </p>
          <form action={saveBusinessProfileAction} className="grid md:grid-cols-2 gap-2">
            <input
              name="businessName"
              placeholder="Business name"
              defaultValue={team.name || ''}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
            <input
              name="businessPhone"
              placeholder="Business phone"
              defaultValue={team.businessPhone || ''}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
            <input
              name="businessWhatsapp"
              placeholder="Business WhatsApp number"
              defaultValue={team.businessWhatsapp || ''}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
            <input
              name="businessWebsiteUrl"
              placeholder="Business website URL (e.g. https://example.com)"
              defaultValue={team.businessWebsiteUrl || ''}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
            <input
              name="businessCategory"
              placeholder="Business category (e.g. Grocery)"
              defaultValue={team.businessCategory || ''}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
            <input
              name="businessAddress"
              placeholder="Business address"
              defaultValue={team.businessAddress || ''}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
            <input
              name="shopSlug"
              placeholder="Shop slug (e.g. iba-fresh-mart)"
              defaultValue={team.shopSlug || ''}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isStorefrontPublic"
                value="true"
                defaultChecked={Boolean(team.isStorefrontPublic)}
              />
              Publish shop publicly on `/shops`
            </label>
            <div className="md:col-span-2">
              <BusinessLocationPicker
                initialLat={
                  typeof team.businessLat === 'number' ? team.businessLat / 1_000_000 : null
                }
                initialLng={
                  typeof team.businessLng === 'number' ? team.businessLng / 1_000_000 : null
                }
              />
            </div>
            <div className="md:col-span-2">
              <button className="rounded-md bg-orange-500 px-4 py-2 text-white text-sm hover:bg-orange-600">
                Save profile and create defaults
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {team.businessProfileCompleted ? (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Public storefront</p>
          <p className="text-muted-foreground">
            Share with buyers: {team.shopSlug ? `/shops/${team.shopSlug}` : 'Set shop slug first'}
          </p>
          <p className="text-muted-foreground">
            Visibility: {team.isStorefrontPublic ? 'Public' : 'Private'}
          </p>
          <p className="text-muted-foreground">
            Inventory add-on: {team.inventoryAddonActive ? 'Active' : 'Not active (upgrade for full inventory tools)'}
          </p>
        </div>
      ) : null}

      {canRunFirstProductWizard ? (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-1">First product wizard</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Great, payment is active. Add your first product to start selling.
          </p>
          <form action={createFirstProductAction} className="grid md:grid-cols-4 gap-2">
            <input
              name="name"
              placeholder="Product name"
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
            <input
              name="sku"
              placeholder="SKU"
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
            <input
              name="quantity"
              type="number"
              min={0}
              defaultValue={10}
              placeholder="Opening qty"
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
            <input
              name="purchasePriceNaira"
              type="number"
              min={0}
              step="0.01"
              placeholder="Purchase price (NGN)"
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              required
            />
            <input
              name="sellingPriceNaira"
              type="number"
              min={0}
              step="0.01"
              placeholder="Selling price (NGN)"
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm md:col-span-2"
              required
            />
            <div className="md:col-span-2">
              <button className="rounded-md bg-orange-500 px-4 py-2 text-white text-sm hover:bg-orange-600">
                Create first product
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid md:grid-cols-4 gap-3">
        {[
          ['Items', items.length],
          ['Categories', categories.length],
          ['Brands', brands.length],
          ['Units', units.length],
          ['Warehouses', warehouses.length],
          ['Orders', orders.length],
          ['POS Transactions', pos.length]
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold">{Number(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
