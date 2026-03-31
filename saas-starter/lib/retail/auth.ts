import { getTeamForUser, getUser } from '@/lib/db/queries';

export async function requireRetailContext(opts?: { ownerWrite?: boolean }) {
  const user = await getUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }

  const team = await getTeamForUser();
  if (!team) {
    throw new Error('NO_TEAM');
  }
  if (team.subscriptionStatus !== 'active') {
    throw new Error('SUBSCRIPTION_INACTIVE');
  }

  if (opts?.ownerWrite) {
    const member = team.teamMembers.find((m) => m.userId === user.id);
    if (member?.role !== 'owner') {
      throw new Error('FORBIDDEN');
    }
  }

  return { user, team };
}

export function toHttpError(error: unknown) {
  const message = error instanceof Error ? error.message : 'UNKNOWN';
  if (message === 'UNAUTHORIZED') return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (message === 'NO_TEAM') return Response.json({ error: 'No team found' }, { status: 403 });
  if (message === 'FORBIDDEN') return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (message === 'SUBSCRIPTION_INACTIVE') {
    return Response.json({ error: 'Active subscription required' }, { status: 402 });
  }
  return Response.json({ error: 'Request failed' }, { status: 500 });
}
