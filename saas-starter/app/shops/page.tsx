import Link from 'next/link';

async function getShops() {
  const base = process.env.BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/public/shops`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function ShopsPage() {
  const shops = await getShops();
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Shops</h1>
      {shops.length === 0 ? (
        <p className="text-sm text-muted-foreground">No public shops available yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {shops.map((shop: any) => (
            <Link key={shop.id} href={`/shops/${shop.shopSlug}`} className="border rounded-md p-4 hover:bg-gray-50">
              <p className="font-medium">{shop.name}</p>
              <p className="text-xs text-muted-foreground">{shop.businessCategory || 'General'}</p>
              <p className="text-xs text-muted-foreground">{shop.businessAddress || 'Address not set'}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
