async function count(path: string) {
  try {
    const base = process.env.BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
    const res = await fetch(`${base}${path}`, { cache: 'no-store' });
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export default async function RetailOverviewPage() {
  const [items, categories, brands, units, warehouses, orders, pos] = await Promise.all([
    count('/api/retail/products'),
    count('/api/retail/categories'),
    count('/api/retail/brands'),
    count('/api/retail/units'),
    count('/api/retail/warehouses'),
    count('/api/retail/orders'),
    count('/api/retail/pos')
  ]);

  return (
    <div className="grid md:grid-cols-4 gap-3">
      {[
        ['Items', items],
        ['Categories', categories],
        ['Brands', brands],
        ['Units', units],
        ['Warehouses', warehouses],
        ['Orders', orders],
        ['POS Transactions', pos]
      ].map(([label, value]) => (
        <div key={String(label)} className="rounded-md border p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{Number(value)}</p>
        </div>
      ))}
    </div>
  );
}
