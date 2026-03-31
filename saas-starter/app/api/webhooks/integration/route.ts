import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Inbound hook for cross-service events. Configure your bus or upstream
 * systems to POST here with header X-IbaHub-Webhook-Secret.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.INTEGRATION_INBOUND_WEBHOOK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: 'INTEGRATION_INBOUND_WEBHOOK_SECRET is not set' },
      { status: 503 }
    );
  }

  const provided = request.headers.get('x-ibahub-webhook-secret')?.trim();
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  let payload: unknown;
  if (contentType.includes('application/json')) {
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  } else {
    payload = await request.text();
  }

  return NextResponse.json({
    received: true,
    at: new Date().toISOString(),
    bytes:
      typeof payload === 'string' ? payload.length : JSON.stringify(payload).length
  });
}
