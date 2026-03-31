import { getTeamForUser, getUser } from '@/lib/db/queries';

export async function isOwnerAdmin() {
  const user = await getUser();
  if (!user) return false;
  const team = await getTeamForUser();
  if (!team) return false;
  const member = team.teamMembers.find((m) => m.userId === user.id);
  return member?.role === 'owner';
}
