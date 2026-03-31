'use client';

import { useEffect, useState } from 'react';

type Field = { name: string; label: string; type?: 'text' | 'number' | 'email' };

export function EntityManager({
  title,
  endpoint,
  fields
}: {
  title: string;
  endpoint: string;
  fields: Field[];
}) {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(endpoint, { cache: 'no-store' });
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, [endpoint]);

  async function onCreate(formData: FormData) {
    setLoading(true);
    setError('');
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = String(formData.get(f.name) || '').trim();
      payload[f.name] = f.type === 'number' ? Number(raw || 0) : raw;
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setLoading(false);
    if (!res.ok) {
      const out = await res.json().catch(() => ({}));
      setError(out.error || 'Create failed');
      return;
    }
    await load();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <form
        action={onCreate}
        className="grid md:grid-cols-3 gap-2 p-3 border rounded-lg bg-white"
      >
        {fields.map((f) => (
          <input
            key={f.name}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            name={f.name}
            placeholder={f.label}
            type={f.type || 'text'}
            required
          />
        ))}
        <button
          disabled={loading}
          className="rounded-md bg-orange-500 px-4 py-2 text-white text-sm hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Create'}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={Number(row.id) || idx} className="border rounded-md p-3 text-sm">
            <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(row, null, 2)}</pre>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No records yet.</p> : null}
      </div>
    </section>
  );
}
