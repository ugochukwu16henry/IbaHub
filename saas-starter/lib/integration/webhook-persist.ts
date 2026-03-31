import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { activityLogs, teams, ActivityType } from '@/lib/db/schema';

function persistEnabled(): boolean {
  return process.env.INTEGRATION_WEBHOOK_PERSIST_ACTIVITY !== 'false';
}

export function extractTeamId(
  payload: unknown,
  headerTeamId: string | null | undefined
): number | null {
  if (headerTeamId?.trim()) {
    const n = parseInt(headerTeamId.trim(), 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    const tid = o.teamId ?? o.team_id;
    if (typeof tid === 'number' && Number.isInteger(tid) && tid > 0) return tid;
    if (typeof tid === 'string' && /^\d+$/.test(tid)) return parseInt(tid, 10);
  }
  return null;
}

export function extractEventLabel(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    const e = o.event ?? o.type ?? o.eventType;
    if (typeof e === 'string' && e.length > 0 && e.length < 200) return e;
  }
  return undefined;
}

export async function persistTeamWebhookActivity(opts: {
  baseAction: ActivityType.WEBHOOK_INTEGRATION | ActivityType.WEBHOOK_PAYMENT_DOMAIN;
  teamId: number;
  ipAddress: string;
  payload: unknown;
}): Promise<void> {
  if (!persistEnabled()) return;

  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.id, opts.teamId))
    .limit(1);

  if (!team) return;

  const event = extractEventLabel(opts.payload);
  const action =
    event && event.length > 0
      ? `${opts.baseAction}:${event}`
      : opts.baseAction;

  await db.insert(activityLogs).values({
    teamId: opts.teamId,
    userId: null,
    action,
    ipAddress: opts.ipAddress.slice(0, 45)
  });
}
