import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { retailItems, retailPurchaseRequests, users } from '@/lib/db/schema';
import { requireRetailContext } from '@/lib/retail/auth';
import { updatePurchaseRequestStatusAction } from '../actions';

const money = (kobo: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(kobo / 100);

export default async function RetailPurchaseRequestsPage() {
  const { team } = await requireRetailContext();

  const rows = await db
    .select({
      id: retailPurchaseRequests.id,
      status: retailPurchaseRequests.status,
      quantity: retailPurchaseRequests.quantity,
      totalAmountKobo: retailPurchaseRequests.totalAmountKobo,
      paymentTerms: retailPurchaseRequests.paymentTerms,
      needsDelivery: retailPurchaseRequests.needsDelivery,
      deliveryFrom: retailPurchaseRequests.deliveryFrom,
      deliveryAddress: retailPurchaseRequests.deliveryAddress,
      notes: retailPurchaseRequests.notes,
      createdAt: retailPurchaseRequests.createdAt,
      buyerEmail: users.email,
      itemName: retailItems.name
    })
    .from(retailPurchaseRequests)
    .innerJoin(users, eq(retailPurchaseRequests.buyerUserId, users.id))
    .innerJoin(retailItems, eq(retailPurchaseRequests.itemId, retailItems.id))
    .where(eq(retailPurchaseRequests.teamId, team.id))
    .orderBy(desc(retailPurchaseRequests.createdAt));

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Buyer purchase requests</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No requests yet.</p>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="border rounded-md p-3 space-y-2">
            <p className="font-medium">
              {row.itemName} x {row.quantity} ({money(row.totalAmountKobo)})
            </p>
            <p className="text-xs text-muted-foreground">
              Buyer: {row.buyerEmail} | Payment: {row.paymentTerms} | Delivery:{' '}
              {row.needsDelivery ? `${row.deliveryFrom} -> ${row.deliveryAddress || 'not set'}` : 'No'}
            </p>
            {row.notes ? <p className="text-xs text-muted-foreground">Note: {row.notes}</p> : null}
            <p className="text-xs text-muted-foreground">Status: {row.status}</p>
            <div className="flex flex-wrap gap-2">
              {['accepted', 'rejected', 'paid', 'fulfilled'].map((status) => (
                <form key={status} action={updatePurchaseRequestStatusAction}>
                  <input type="hidden" name="requestId" value={row.id} />
                  <input type="hidden" name="status" value={status} />
                  <button className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">
                    Mark {status}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
