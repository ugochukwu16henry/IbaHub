import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { generatedDocuments } from '@/lib/db/schema';

export async function GET(_: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { kind, id } = await context.params;
  const sourceId = Number(id);
  if (!Number.isFinite(sourceId) || sourceId <= 0) {
    return Response.json({ error: 'Invalid source id' }, { status: 400 });
  }

  const team = await getTeamForUser();
  const rows = await db
    .select({
      id: generatedDocuments.id,
      teamId: generatedDocuments.teamId,
      userId: generatedDocuments.userId,
      sourceKind: generatedDocuments.sourceKind,
      sourceId: generatedDocuments.sourceId,
      documentType: generatedDocuments.documentType,
      title: generatedDocuments.title,
      reference: generatedDocuments.reference,
      createdAt: generatedDocuments.createdAt
    })
    .from(generatedDocuments)
    .where(
      and(eq(generatedDocuments.sourceKind, kind), eq(generatedDocuments.sourceId, sourceId))
    )
    .orderBy(desc(generatedDocuments.id));

  const allowed = rows.filter((row) => row.userId === user.id || (row.teamId && team && row.teamId === team.id));
  return Response.json({ data: allowed });
}
