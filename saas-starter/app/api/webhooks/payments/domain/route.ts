import { NextRequest, NextResponse } from 'next/server';
import { ActivityType } from '@/lib/db/schema';
import { getWebhookClientIp } from '@/lib/integration/webhook-http';
import { tryClaimWebhookInbox } from '@/lib/integration/webhook-idempotency';
import { webhookRateLimitResponse } from '@/lib/integration/webhook-rate-limit';
import {
  extractTeamId,
  persistTeamWebhookActivity
} from '@/lib/integration/webhook-persist';

export const runtime = 'nodejs';

/**
 * Settlement / wallet events from logistics, gig, or retail backends.
 * INTEGRATION_PLAN §3.7 — keep idempotent handlers in each service; this is the shell ingress.
 */
export async function POST(request: NextRequest) {
  const limited = webhookRateLimitResponse(request);
  if (limited) return limited;

  const expected = process.env.INTEGRATION_PAYMENTS_WEBHOOK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: 'INTEGRATION_PAYMENTS_WEBHOOK_SECRET is not set' },
      { status: 503 }
    );
  }

  const provided =
    request.headers.get('x-ibahub-payments-secret')?.trim() ||
    request.headers.get('x-ibahub-webhook-secret')?.trim();
  if (provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
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

  const headerTeam = request.headers.get('x-ibahub-team-id');
  const teamId = extractTeamId(payload, headerTeam);

  const claim = await tryClaimWebhookInbox(
    idempotencyKey,
    'payments',
    teamId
  );
  const duplicate = claim === 'duplicate';

  if (teamId !== null && !duplicate) {
    await persistTeamWebhookActivity({
      baseAction: ActivityType.WEBHOOK_PAYMENT_DOMAIN,
      teamId,
      ipAddress: getWebhookClientIp(request),
      payload
    });
  }

  return NextResponse.json({
    received: true,
    at: new Date().toISOString(),
    duplicate,
    teamActivityLogged: teamId !== null && !duplicate,
    idempotencyKey: idempotencyKey ?? null,
    bytes:
      typeof payload === 'string' ? payload.length : JSON.stringify(payload).length
  });
}
