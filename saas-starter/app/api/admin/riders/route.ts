import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { riderProfiles, users } from '@/lib/db/schema';

export const runtime = 'nodejs';

async function isOwnerAdmin() {
  const user = await getUser();
  if (!user) return false;
  const team = await getTeamForUser();
  if (!team) return false;
  const member = team.teamMembers.find((m) => m.userId === user.id);
  return member?.role === 'owner';
}

export async function GET(request: Request) {
  const allowed = await isOwnerAdmin();
  if (!allowed) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status')?.trim() || 'pending';
  const statusFilter =
    status === 'pending' || status === 'verified' || status === 'rejected'
      ? status
      : 'pending';

  const riders = await db
    .select({
      id: riderProfiles.id,
      userId: riderProfiles.userId,
      name: users.name,
      email: users.email,
      phone: riderProfiles.phone,
      vehicleType: riderProfiles.vehicleType,
      serviceZone: riderProfiles.serviceZone,
      verificationStatus: riderProfiles.verificationStatus,
      availabilityStatus: riderProfiles.availabilityStatus,
      createdAt: riderProfiles.createdAt
    })
    .from(riderProfiles)
    .innerJoin(users, eq(riderProfiles.userId, users.id))
    .where(
      and(eq(riderProfiles.verificationStatus, statusFilter), isNull(users.deletedAt))
    )
    .orderBy(desc(riderProfiles.createdAt));

  return Response.json({ riders, status: statusFilter, count: riders.length });
}

