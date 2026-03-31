'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type Item = {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  sellingPriceKobo: number;
  description: string | null;
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

export default function ShopProductDetailsPage() {
  const params = useParams<{ slug: string; id: string }>();
  const slug = String(params?.slug || '');
  const id = Number(params?.id || 0);
  const [item, setItem] = useState<Item | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!slug || !id) return;
    fetch(`/api/public/shops/${slug}/products`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data.items) ? (data.items as Item[]) : [];
        setItem(items.find((i) => i.id === id) || null);
      });
  }, [slug, id]);

  const images = useMemo(() => parseJson<string[]>(item?.images, []), [item?.images]);
  const details = useMemo(
    () => parseJson<Record<string, string>>(item?.details, {}),
    [item?.details]
  );
  const variants = useMemo(
    () =>
      parseJson<Array<{ name: string; value: string; stock?: number; extraPriceNaira?: number }>>(
        item?.variants,
        []
      ),
    [item?.variants]
  );

  if (!item) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">Product not found.</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <Link href={`/shops/${slug}`} className="text-sm text-muted-foreground">
        Back to shop
      </Link>
      <h1 className="text-2xl font-semibold">{item.name}</h1>
      <p className="text-sm text-muted-foreground">
        SKU: {item.sku} • Stock: {item.quantity} • NGN {(item.sellingPriceKobo / 100).toLocaleString()}
      </p>

      {images.length ? (
        <section className="space-y-2">
          <img
            src={images[Math.min(activeImage, images.length - 1)]}
            alt={item.name}
            className="w-full max-h-[420px] rounded-md border object-cover"
          />
          <div className="flex gap-2 flex-wrap">
            {images.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                onClick={() => setActiveImage(idx)}
                className={`border rounded-md overflow-hidden ${activeImage === idx ? 'ring-2 ring-orange-500' : ''}`}
              >
                <img src={url} alt={`view-${idx + 1}`} className="w-20 h-20 object-cover" />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-md p-3">
          <p className="font-medium mb-2">Product details</p>
          {Object.keys(details).length === 0 ? (
            <p className="text-sm text-muted-foreground">No extra details added yet.</p>
          ) : (
            Object.entries(details).map(([k, v]) => (
              <p key={k} className="text-sm">
                <span className="text-muted-foreground">{k}:</span> {v}
              </p>
            ))
          )}
        </div>
        <div className="border rounded-md p-3">
          <p className="font-medium mb-2">Variants (sizes/views/options)</p>
          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variants added yet.</p>
          ) : (
            variants.map((v, idx) => (
              <p key={`${v.name}-${v.value}-${idx}`} className="text-sm">
                {v.name}: {v.value}
                {typeof v.extraPriceNaira === 'number' ? ` (+NGN ${v.extraPriceNaira})` : ''}
                {typeof v.stock === 'number' ? ` • stock ${v.stock}` : ''}
              </p>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
