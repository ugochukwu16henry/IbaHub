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

  return (
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
  );
}
