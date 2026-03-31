'use client';

import { useEffect, useMemo, useState } from 'react';

type RetailItem = { id: number; name: string; sellingPriceKobo: number };

export function SalesConsole({ mode }: { mode: 'orders' | 'pos' }) {
  const [items, setItems] = useState<RetailItem[]>([]);
  const [itemId, setItemId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [lines, setLines] = useState<Array<{ itemId: number; quantity: number }>>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');

  const endpoint = mode === 'orders' ? '/api/retail/orders' : '/api/retail/pos';

  async function load() {
    const [itemsRes, listRes] = await Promise.all([
      fetch('/api/retail/products', { cache: 'no-store' }),
      fetch(endpoint, { cache: 'no-store' })
    ]);
    const itemsData = await itemsRes.json();
    const listData = await listRes.json();
    setItems(Array.isArray(itemsData) ? itemsData : []);
    setLogs(Array.isArray(listData) ? listData : []);
    if (Array.isArray(itemsData) && itemsData[0]) setItemId(itemsData[0].id);
  }

  useEffect(() => {
    load();
  }, [mode]);

  const totalNaira = useMemo(() => {
    return lines.reduce((sum, line) => {
      const item = items.find((i) => i.id === line.itemId);
      return sum + ((item?.sellingPriceKobo || 0) / 100) * line.quantity;
    }, 0);
  }, [items, lines]);

  async function submit() {
    setError('');
    const payload =
      mode === 'pos'
        ? {
            idempotencyKey: `pos_${Date.now()}`,
            paymentMethod: 'cash',
            lines
          }
        : { lines };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const out = await res.json().catch(() => ({}));
      setError(out.error || 'Save failed');
      return;
    }
    setLines([]);
    await load();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{mode === 'pos' ? 'POS' : 'Orders'}</h2>
      <div className="border rounded-md p-3 space-y-3">
        <div className="flex flex-wrap gap-2 items-end">
          <select
            className="rounded-md border border-input px-2 py-2 text-sm"
            value={itemId || ''}
            onChange={(e) => setItemId(Number(e.target.value))}
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-input px-2 py-2 text-sm w-28"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => {
              if (!itemId || quantity <= 0) return;
              setLines((prev) => [...prev, { itemId, quantity }]);
            }}
          >
            Add line
          </button>
        </div>
        <pre className="text-xs bg-gray-50 rounded p-2 overflow-x-auto">{JSON.stringify(lines, null, 2)}</pre>
        <p className="text-sm">Estimated total: NGN {totalNaira.toFixed(2)}</p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          onClick={submit}
          className="rounded-md bg-orange-500 px-4 py-2 text-white text-sm hover:bg-orange-600"
        >
          {mode === 'pos' ? 'Complete POS Sale' : 'Create Order'}
        </button>
      </div>
      <div className="space-y-2">
        {logs.map((row, idx) => (
          <pre key={Number(row.id) || idx} className="text-xs border rounded-md p-3 overflow-x-auto">
            {JSON.stringify(row, null, 2)}
          </pre>
        ))}
      </div>
    </section>
  );
}
