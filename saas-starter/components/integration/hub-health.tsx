'use client';

import { useEffect, useState } from 'react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import type { IntegrationServiceId } from '@/lib/integration/services';

type HealthRow = {
  id: IntegrationServiceId;
  configured: boolean;
  ok: boolean;
  status?: number;
  latencyMs: number;
  checkedUrl?: string;
  error?: string;
};

type Payload = { services: HealthRow[]; checkedAt: string };

export function IntegrationHubHealth({
  items
}: {
  items: { id: IntegrationServiceId; label: string }[];
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/integration/health');
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as Payload;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground inline-flex items-center gap-2 mb-8">
        <Loader2 className="size-4 animate-spin" />
        Checking upstream health…
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-amber-700 mb-8">
        Could not load health status. Sign in and try again.
      </p>
    );
  }

  const byId = Object.fromEntries(data.services.map((s) => [s.id, s])) as Record<
    IntegrationServiceId,
    HealthRow
  >;

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-medium text-gray-900">Upstream health</h2>
        <time
          className="text-xs text-muted-foreground"
          dateTime={data.checkedAt}
        >
          Last check: {new Date(data.checkedAt).toLocaleString()}
        </time>
      </div>
      <ul className="space-y-2 text-sm">
        {items.map(({ id, label }) => {
          const row = byId[id];
          if (!row) return null;
          if (!row.configured) {
            return (
              <li
                key={id}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <WifiOff className="size-4 shrink-0" />
                <span>{label}</span>
                <span className="text-xs">— not configured</span>
              </li>
            );
          }
          return (
            <li key={id} className="flex flex-wrap items-center gap-2">
              {row.ok ? (
                <Wifi className="size-4 shrink-0 text-green-600" />
              ) : (
                <WifiOff className="size-4 shrink-0 text-red-600" />
              )}
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground text-xs">
                {row.ok
                  ? `HTTP ${row.status ?? '—'} · ${row.latencyMs}ms`
                  : row.error
                  ? row.error
                  : `HTTP ${row.status ?? '—'} · ${row.latencyMs}ms`}
              </span>
              {row.checkedUrl ? (
                <code className="text-[10px] bg-gray-50 px-1 rounded truncate max-w-[220px] md:max-w-md">
                  {row.checkedUrl}
                </code>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
