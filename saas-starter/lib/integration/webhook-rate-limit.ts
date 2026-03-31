import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import {
  memoryWindowRateLimit,
  webhookRateLimitMax,
  webhookRateLimitWindowMs
} from '@/lib/rate-limit/memory-window';
import { getWebhookClientIp } from '@/lib/integration/webhook-http';

/** Returns 429 response or null when under limit (best-effort in-process; §3.8). */
export function webhookRateLimitResponse(request: NextRequest): NextResponse | null {
  const ip = getWebhookClientIp(request);
  const max = webhookRateLimitMax();
  const windowMs = webhookRateLimitWindowMs();
  const r = memoryWindowRateLimit(`webhook:${ip}`, max, windowMs);
  if (r.ok) return null;
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: { 'Retry-After': String(r.retryAfterSec) }
    }
  );
}
