import type { NextRequest } from 'next/server';

export function getWebhookClientIp(request: NextRequest): string {
  const fwd = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return fwd || request.headers.get('x-real-ip')?.trim() || 'webhook';
}
