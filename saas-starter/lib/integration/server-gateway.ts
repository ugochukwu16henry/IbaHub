import 'server-only';

import { cookies } from 'next/headers';
import type { IntegrationServiceId } from '@/lib/integration/services';

/**
 * Server-side call through the authenticated app gateway (forwards session cookie).
 */
export async function gatewayFetch(
  service: IntegrationServiceId,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const base =
    process.env.BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  const rel = path.replace(/^\//, '');
  const url = `${base}/api/gateway/${service}/${rel}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const headers = new Headers(init?.headers);
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json, */*');
  }
  headers.set('cookie', cookieHeader);

  return fetch(url, {
    ...init,
    headers,
    cache: 'no-store'
  });
}
