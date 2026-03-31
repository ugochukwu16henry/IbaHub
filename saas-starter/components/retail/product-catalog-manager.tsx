'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  sellingPriceKobo: number;
  images?: string | null;
  details?: string | null;
  variants?: string | null;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function ProductCatalogManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/retail/products', { cache: 'no-store' });
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(formData: FormData) {
    setLoading(true);
    setError('');
    const imageUrls = String(formData.get('imageUrls') || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    const detailsLines = String(formData.get('details') || '')
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
    const details: Record<string, string> = {};
    for (const line of detailsLines) {
      const [k, ...rest] = line.split(':');
      if (!k || rest.length === 0) continue;
      details[k.trim()] = rest.join(':').trim();
    }
    const variantsLines = String(formData.get('variants') || '')
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean);
    const variants = variantsLines
      .map((line) => {
        const [name, value, extraPriceNaira, stock] = line.split('|').map((s) => s.trim());
        if (!name || !value) return null;
        return {
          name,
          value,
          extraPriceNaira: Number(extraPriceNaira || 0),
          stock: Number(stock || 0)
        };
      })
      .filter(Boolean);

    const payload = {
      name: String(formData.get('name') || '').trim(),
      sku: String(formData.get('sku') || '').trim(),
      quantity: Number(formData.get('quantity') || 0),
      reorderPoint: Number(formData.get('reorderPoint') || 5),
      purchasePriceNaira: Number(formData.get('purchasePriceNaira') || 0),
      sellingPriceNaira: Number(formData.get('sellingPriceNaira') || 0),
      images: imageUrls,
      details,
      variants
    };

    const res = await fetch('/api/retail/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(out.error || 'Failed to create product');
      return;
    }
    await load();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Products with images and custom details</h2>
      <form action={create} className="border rounded-md p-4 grid md:grid-cols-2 gap-2">
        <input name="name" placeholder="Product name" className="rounded-md border px-3 py-2 text-sm" required />
        <input name="sku" placeholder="SKU" className="rounded-md border px-3 py-2 text-sm" required />
        <input name="quantity" type="number" min={0} defaultValue={0} className="rounded-md border px-3 py-2 text-sm" required />
        <input name="reorderPoint" type="number" min={0} defaultValue={5} className="rounded-md border px-3 py-2 text-sm" />
        <input name="purchasePriceNaira" type="number" min={0} step="0.01" placeholder="Purchase price" className="rounded-md border px-3 py-2 text-sm" required />
        <input name="sellingPriceNaira" type="number" min={0} step="0.01" placeholder="Selling price" className="rounded-md border px-3 py-2 text-sm" required />
        <textarea
          name="imageUrls"
          placeholder="Image URLs (comma separated)"
          className="md:col-span-2 rounded-md border px-3 py-2 text-sm"
        />
        <textarea
          name="details"
          placeholder={`Other details (one per line):\nsizeGuide: S-XXL\nmaterial: Cotton\ncolor: Blue`}
          className="rounded-md border px-3 py-2 text-sm min-h-[110px]"
        />
        <textarea
          name="variants"
          placeholder={`Variants (one per line):\nSize|S|0|10\nSize|M|0|8\nView|Front|0|0`}
          className="rounded-md border px-3 py-2 text-sm min-h-[110px]"
        />
        <div className="md:col-span-2">
          <button
            disabled={loading}
            className="rounded-md bg-orange-500 px-4 py-2 text-white text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Add product'}
          </button>
        </div>
        {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
      </form>

      <div className="grid md:grid-cols-2 gap-3">
        {products.map((p) => {
          const images = parseJson<string[]>(p.images, []);
          const details = parseJson<Record<string, string>>(p.details, {});
          const variants = parseJson<Array<{ name: string; value: string; stock?: number }>>(
            p.variants,
            []
          );
          return (
            <div key={p.id} className="border rounded-md p-3 space-y-2">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">
                SKU {p.sku} • Stock {p.quantity} • NGN {(p.sellingPriceKobo / 100).toLocaleString()}
              </p>
              {images[0] ? (
                <img src={images[0]} alt={p.name} className="w-full h-40 rounded-md object-cover border" />
              ) : null}
              {Object.keys(details).length ? (
                <div className="text-xs text-muted-foreground">
                  {Object.entries(details).map(([k, v]) => (
                    <p key={k}>
                      {k}: {v}
                    </p>
                  ))}
                </div>
              ) : null}
              {variants.length ? (
                <div className="text-xs text-muted-foreground">
                  {variants.map((v, i) => (
                    <p key={`${v.name}-${v.value}-${i}`}>
                      {v.name}: {v.value}
                      {typeof v.stock === 'number' ? ` (stock ${v.stock})` : ''}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
