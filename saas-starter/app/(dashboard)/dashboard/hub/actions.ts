'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { teams, type User } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import {
  serializeIntegrationMappings,
  type IntegrationMappings
} from '@/lib/integration/mappings';

const schema = z.object({
  logisticsOrgId: z.string().max(500).optional(),
  gigOrgId: z.string().max(500).optional(),
  retailOrgId: z.string().max(500).optional()
});

function canEditTeamMappings(
  user: User,
  team: NonNullable<Awaited<ReturnType<typeof getTeamForUser>>>
) {
  const member = team.teamMembers.find((m) => m.userId === user.id);
  return member?.role === 'owner';
}

export const updateIntegrationMappings = validatedActionWithUser(
  schema,
  async (data, _formData, user) => {
    const team = await getTeamForUser();
    if (!team) {
      return { error: 'No team found' };
    }
    if (!canEditTeamMappings(user, team)) {
      return {
        error: 'Only team owners can update service tenant IDs.'
      };
    }

    const next: IntegrationMappings = {
      logisticsOrgId: data.logisticsOrgId?.trim() || null,
      gigOrgId: data.gigOrgId?.trim() || null,
      retailOrgId: data.retailOrgId?.trim() || null
    };

    const empty =
      !next.logisticsOrgId && !next.gigOrgId && !next.retailOrgId;

    await db
      .update(teams)
      .set({
        integrationMappings: empty
          ? null
          : serializeIntegrationMappings(next),
        updatedAt: new Date()
      })
      .where(eq(teams.id, team.id));

    return { success: 'Integration tenant IDs saved.' };
  }
);
