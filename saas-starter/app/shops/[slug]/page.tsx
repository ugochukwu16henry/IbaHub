'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type ShopItem = {
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
type Testimonial = {
  id: number;
  rating: number;
  professionalism: number;
  honesty: number;
  quality: number;
  communication: number;
  timeliness: number;
  comment: string | null;
};
type StorefrontSettings = {
  showPrice?: boolean;
  showStock?: boolean;
  showCategory?: boolean;
  showPhone?: boolean;
  showWhatsapp?: boolean;
  showWebsite?: boolean;
  showMap?: boolean;
  customHeadline?: string | null;
  customNotice?: string | null;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function ShopDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || '');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopWhatsapp, setShopWhatsapp] = useState('');
  const [shopWebsiteUrl, setShopWebsiteUrl] = useState('');
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalTestimonials, setTotalTestimonials] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<StorefrontSettings>({});
  const [items, setItems] = useState<ShopItem[]>([]);
  const [itemId, setItemId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentTerms, setPaymentTerms] = useState('agreed_with_owner');
  const [needsDelivery, setNeedsDelivery] = useState(false);
  const [deliveryFrom, setDeliveryFrom] = useState<'shop' | 'home'>('shop');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public/shops/${slug}/products`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.shop) {
          setShopName(data.shop.name || '');
          setShopAddress(data.shop.businessAddress || '');
          setShopPhone(data.shop.businessPhone || '');
          setShopWhatsapp(data.shop.businessWhatsapp || '');
          setShopWebsiteUrl(data.shop.businessWebsiteUrl || '');
          setShopLat(
            typeof data.shop.businessLat === 'number' ? data.shop.businessLat / 1_000_000 : null
          );
          setShopLng(
            typeof data.shop.businessLng === 'number' ? data.shop.businessLng / 1_000_000 : null
          );
          setItems(Array.isArray(data.items) ? data.items : []);
          setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
          setAverageRating(Number(data.summary?.averageRating || 0));
          setTotalTestimonials(Number(data.summary?.totalTestimonials || 0));
          setSettings(parseJson<StorefrontSettings>(data.shop.storefrontSettings, {}));
          if (Array.isArray(data.items) && data.items[0]) setItemId(data.items[0].id);
        }
      });
  }, [slug]);
  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
  const shopMapUrl =
    mapToken && shopLat !== null && shopLng !== null
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+f97316(${shopLng},${shopLat})/${shopLng},${shopLat},14/900x280?access_token=${mapToken}`
      : '';

  const selected = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);
  const totalNaira = ((selected?.sellingPriceKobo || 0) * quantity) / 100;

  async function submitRequest() {
    setStatus('');
    const res = await fetch('/api/public/purchase-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        shopSlug: slug,
        itemId,
        quantity,
        paymentTerms,
        needsDelivery,
        deliveryFrom,
        deliveryAddress,
        notes
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error || 'Request failed');
      return;
    }
    setStatus('Purchase request submitted. Pay based on agreed terms with owner.');
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <Link href="/shops" className="text-sm text-muted-foreground">
        Back to shops
      </Link>
      <h1 className="text-2xl font-semibold">{shopName || 'Shop'}</h1>
      {settings.customHeadline ? (
        <p className="text-sm font-medium">{settings.customHeadline}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">{shopAddress || 'Address not provided'}</p>
      {settings.customNotice ? (
        <p className="text-sm text-muted-foreground">{settings.customNotice}</p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Trusted rating: {averageRating.toFixed(1)}/5 ({totalTestimonials} approved testimonials)
      </p>
      <p className="text-sm">
        Contact for payment terms:
        {settings.showPhone !== false && shopPhone ? ` Phone: ${shopPhone}` : ''}
        {settings.showWhatsapp !== false && shopWhatsapp ? ` | WhatsApp: ${shopWhatsapp}` : ''}
      </p>
      <div className="flex flex-wrap gap-2">
        {settings.showPhone !== false && shopPhone ? (
          <a
            href={`tel:${shopPhone.replace(/\s+/g, '')}`}
            className="inline-block rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Call owner
          </a>
        ) : null}
        {settings.showWhatsapp !== false && shopWhatsapp ? (
          <a
            href={`https://wa.me/${shopWhatsapp.replace(/[^\d]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Chat owner on WhatsApp
          </a>
        ) : null}
        {settings.showMap !== false && shopLat !== null && shopLng !== null ? (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${shopLat},${shopLng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Get directions
          </a>
        ) : null}
        {settings.showWebsite !== false && shopWebsiteUrl ? (
          <a
            href={shopWebsiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Visit website
          </a>
        ) : null}
      </div>
      {settings.showMap !== false && shopMapUrl ? (
        <img src={shopMapUrl} alt="Business location map" className="w-full rounded-md border object-cover" />
      ) : null}

      <section className="grid md:grid-cols-2 gap-3">
        {items.map((item) => (
          <Link key={item.id} href={`/shops/${slug}/products/${item.id}`} className="border rounded-md p-3 block hover:bg-gray-50">
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
            {settings.showStock !== false ? (
              <p className="text-xs text-muted-foreground">Stock: {item.quantity}</p>
            ) : null}
            {settings.showPrice !== false ? (
              <p className="text-sm font-semibold">NGN {(item.sellingPriceKobo / 100).toLocaleString()}</p>
            ) : null}
            {parseJson<string[]>(item.images, [])[0] ? (
              <img
                src={parseJson<string[]>(item.images, [])[0]}
                alt={item.name}
                className="w-full h-40 rounded-md border object-cover mt-2"
              />
            ) : null}
          </Link>
        ))}
      </section>

      <section className="border rounded-md p-4 space-y-3">
        <h2 className="text-lg font-semibold">Request purchase</h2>
        <div className="grid md:grid-cols-2 gap-2">
          <select
            value={itemId || ''}
            onChange={(e) => setItemId(Number(e.target.value))}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="rounded-md border border-input px-3 py-2 text-sm"
            placeholder="Quantity"
          />
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            <option value="agreed_with_owner">Agreed with owner</option>
            <option value="upfront_to_owner">Upfront payment to owner</option>
            <option value="on_delivery">Payment on delivery</option>
          </select>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border border-input px-3 py-2 text-sm"
            placeholder="Notes"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={needsDelivery}
            onChange={(e) => setNeedsDelivery(e.target.checked)}
          />
          Need rider/truck delivery
        </label>

        {needsDelivery ? (
          <div className="grid md:grid-cols-2 gap-2">
            <select
              value={deliveryFrom}
              onChange={(e) => setDeliveryFrom(e.target.value as 'shop' | 'home')}
              className="rounded-md border border-input px-3 py-2 text-sm"
            >
              <option value="shop">Pickup from shop</option>
              <option value="home">Pickup from my home</option>
            </select>
            <input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="rounded-md border border-input px-3 py-2 text-sm"
              placeholder="Delivery address"
            />
          </div>
        ) : null}

        <p className="text-sm font-medium">Estimated total: NGN {totalNaira.toLocaleString()}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={submitRequest}
            className="rounded-md bg-orange-500 px-4 py-2 text-white text-sm hover:bg-orange-600"
          >
            Submit request
          </button>
          {needsDelivery ? (
            <Link
              href={`/dashboard/rides/book?pickupLabel=${encodeURIComponent(
                deliveryFrom === 'home' ? 'My home pickup' : `${shopName || 'Shop'} pickup`
              )}&dropoffLabel=${encodeURIComponent(deliveryAddress || 'My dropoff')}`}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Book rider/truck now
            </Link>
          ) : null}
        </div>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </section>

      <section className="border rounded-md p-4 space-y-2">
        <h2 className="text-lg font-semibold">Approved buyer testimonials</h2>
        {testimonials.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approved testimonials yet.</p>
        ) : (
          testimonials.map((t) => (
            <div key={t.id} className="border rounded-md p-3 text-sm space-y-1">
              <p className="font-medium">Rating: {t.rating}/5</p>
              <p className="text-xs text-muted-foreground">
                Professionalism {t.professionalism}/5 • Honesty {t.honesty}/5 • Quality {t.quality}/5
              </p>
              <p className="text-xs text-muted-foreground">
                Communication {t.communication}/5 • Timeliness {t.timeliness}/5
              </p>
              {t.comment ? <p className="text-xs text-muted-foreground">{t.comment}</p> : null}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
