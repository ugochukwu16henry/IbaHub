'use client';

import { useEffect, useState } from 'react';

export default function RetailInventoryAdjustmentsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    fetch('/api/retail/inventory-adjustments', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]));
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Inventory adjustments</h2>
      {rows.map((row, idx) => (
        <pre key={Number(row.id) || idx} className="text-xs border rounded-md p-3 overflow-x-auto">
          {JSON.stringify(row, null, 2)}
        </pre>
      ))}
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No adjustments yet.</p> : null}
    </section>
  );
}
