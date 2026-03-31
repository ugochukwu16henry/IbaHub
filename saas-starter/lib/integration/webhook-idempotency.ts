import 'server-only';

import { db } from '@/lib/db/drizzle';
import { webhookInbox } from '@/lib/db/schema';

export type WebhookInboxSource = 'integration' | 'payments';

/**
 * Claim Idempotency-Key for this source. Without a key, returns 'skipped'
 * (caller may process each delivery; duplicates possible).
 */
export async function tryClaimWebhookInbox(
  idempotencyKey: string | null | undefined,
  source: WebhookInboxSource,
  teamId: number | null
): Promise<'skipped' | 'new' | 'duplicate'> {
  const key = idempotencyKey?.trim();
  if (!key) return 'skipped';

  const trimmed = key.slice(0, 512);
  const inserted = await db
    .insert(webhookInbox)
    .values({
      idempotencyKey: trimmed,
      source,
      teamId
    })
    .onConflictDoNothing({
      target: [webhookInbox.idempotencyKey, webhookInbox.source]
    })
    .returning({ id: webhookInbox.id });

  return inserted.length > 0 ? 'new' : 'duplicate';
}
