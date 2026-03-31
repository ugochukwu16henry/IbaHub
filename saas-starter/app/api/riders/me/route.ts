import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { riderLocations, riderProfiles } from '@/lib/db/schema';
import { toMicroDegrees } from '@/lib/rides/geo';

export const runtime = 'nodejs';

const patchSchema = z.object({
  phone: z.string().max(30).optional(),
  vehicleType: z.string().max(40).optional(),
  serviceZone: z.string().max(100).optional(),
  availabilityStatus: z.enum(['offline', 'available', 'busy']).optional(),
  photoUrl: z.string().url().max(2048).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  heading: z.number().optional(),
  isOnline: z.boolean().optional()
});

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(riderProfiles)
    .where(eq(riderProfiles.userId, user.id))
    .limit(1);

  if (!profile) {
    return Response.json({ error: 'Rider profile not found' }, { status: 404 });
  }

  return Response.json({ profile });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
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

  const patch = parsed.data;
  const [updated] = await db
    .update(riderProfiles)
    .set({
      phone: patch.phone?.trim() ?? undefined,
      vehicleType: patch.vehicleType?.trim() ?? undefined,
      serviceZone: patch.serviceZone?.trim() ?? undefined,
      availabilityStatus: patch.availabilityStatus,
      photoUrl: patch.photoUrl?.trim() ?? undefined,
      updatedAt: new Date()
    })
    .where(and(eq(riderProfiles.userId, user.id)))
    .returning();

  if (!updated) {
    return Response.json({ error: 'Rider profile not found' }, { status: 404 });
  }

  if (
    Number.isFinite(patch.lat) &&
    Number.isFinite(patch.lng)
  ) {
    await db
      .insert(riderLocations)
      .values({
        riderProfileId: updated.id,
        lat: toMicroDegrees(patch.lat as number),
        lng: toMicroDegrees(patch.lng as number),
        heading: Number.isFinite(patch.heading) ? Math.round(patch.heading as number) : null,
        isOnline: patch.isOnline ?? updated.availabilityStatus === 'available',
        lastSeenAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: riderLocations.riderProfileId,
        set: {
          lat: toMicroDegrees(patch.lat as number),
          lng: toMicroDegrees(patch.lng as number),
          heading: Number.isFinite(patch.heading) ? Math.round(patch.heading as number) : null,
          isOnline: patch.isOnline ?? updated.availabilityStatus === 'available',
          lastSeenAt: new Date(),
          updatedAt: new Date()
        }
      });
  }

  return Response.json({ profile: updated });
}

