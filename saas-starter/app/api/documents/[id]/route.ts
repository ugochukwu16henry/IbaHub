import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { generatedDocuments } from '@/lib/db/schema';

export const runtime = 'nodejs';

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number((await context.params).id);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid document id' }, { status: 400 });
  }

  const [doc] = await db.select().from(generatedDocuments).where(eq(generatedDocuments.id, id)).limit(1);
  if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 });

  const team = await getTeamForUser();
  const canRead =
    doc.userId === user.id || (doc.teamId && team && doc.teamId === team.id);
  if (!canRead) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const bytes = Buffer.from(doc.contentBase64, 'base64');
  return new Response(bytes, {
    status: 200,
    headers: {
      'content-type': doc.mimeType || 'application/pdf',
      'content-disposition': `attachment; filename="document-${doc.id}.pdf"`
    }
  });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number((await context.params).id);
  if (!Number.isFinite(id) || id <= 0) {
    return Response.json({ error: 'Invalid document id' }, { status: 400 });
  }

  const [doc] = await db.select().from(generatedDocuments).where(eq(generatedDocuments.id, id)).limit(1);
  if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 });

  const team = await getTeamForUser();
  const canDelete =
    doc.userId === user.id || (doc.teamId && team && doc.teamId === team.id);
  if (!canDelete) return Response.json({ error: 'Forbidden' }, { status: 403 });

  await db.delete(generatedDocuments).where(and(eq(generatedDocuments.id, id)));
  return Response.json({ ok: true });
}
