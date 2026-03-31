import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { retailWarehouses } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { parseId, readJson } from '@/app/api/retail/_shared';

const schema = z.object({ name: z.string().min(1), address: z.string().optional() });

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext();
    const id = parseId((await context.params).id);
    const [row] = await db
      .select()
      .from(retailWarehouses)
      .where(and(eq(retailWarehouses.id, id), eq(retailWarehouses.teamId, team.id)))
      .limit(1);
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(row);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const id = parseId((await context.params).id);
    const parsed = schema.partial().safeParse(await readJson(request));
    if (!parsed.success) return Response.json({ error: 'Invalid payload' }, { status: 400 });
    const [row] = await db
      .update(retailWarehouses)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(retailWarehouses.id, id), eq(retailWarehouses.teamId, team.id)))
      .returning();
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(row);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const id = parseId((await context.params).id);
    await db
      .delete(retailWarehouses)
      .where(and(eq(retailWarehouses.id, id), eq(retailWarehouses.teamId, team.id)));
    return Response.json({ success: true });
  } catch (error) {
    return toHttpError(error);
  }
}
