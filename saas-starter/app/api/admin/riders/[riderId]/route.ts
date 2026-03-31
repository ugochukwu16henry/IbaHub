import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { riderProfiles } from '@/lib/db/schema';

export const runtime = 'nodejs';

const patchSchema = z.object({
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  availabilityStatus: z.enum(['offline', 'available', 'busy']).optional()
});

async function isOwnerAdmin() {
  const user = await getUser();
  if (!user) return false;
  const team = await getTeamForUser();
  if (!team) return false;
  const member = team.teamMembers.find((m) => m.userId === user.id);
  return member?.role === 'owner';
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ riderId: string }> }
) {
  const allowed = await isOwnerAdmin();
  if (!allowed) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { riderId } = await context.params;
  const id = parseInt(riderId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid rider id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(riderProfiles)
    .set({
      verificationStatus: parsed.data.verificationStatus,
      availabilityStatus:
        parsed.data.availabilityStatus ??
        (parsed.data.verificationStatus === 'verified' ? 'available' : 'offline'),
      updatedAt: new Date()
    })
    .where(and(eq(riderProfiles.id, id)))
    .returning();

  if (!updated) {
    return Response.json({ error: 'Rider profile not found' }, { status: 404 });
  }

  return Response.json({ rider: updated });
}

