import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { retailUnits } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { parseId, readJson } from '@/app/api/retail/_shared';

const schema = z.object({ name: z.string().min(1), abbreviation: z.string().optional() });

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({ requireInventoryAddon: true });
    const id = parseId((await context.params).id);
    const [row] = await db
      .select()
      .from(retailUnits)
      .where(and(eq(retailUnits.id, id), eq(retailUnits.teamId, team.id)))
      .limit(1);
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(row);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({
      ownerWrite: true,
      requireInventoryAddon: true
    });
    const id = parseId((await context.params).id);
    const parsed = schema.partial().safeParse(await readJson(request));
    if (!parsed.success) return Response.json({ error: 'Invalid payload' }, { status: 400 });
    const [row] = await db
      .update(retailUnits)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(retailUnits.id, id), eq(retailUnits.teamId, team.id)))
      .returning();
    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(row);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { team } = await requireRetailContext({
      ownerWrite: true,
      requireInventoryAddon: true
    });
    const id = parseId((await context.params).id);
    await db.delete(retailUnits).where(and(eq(retailUnits.id, id), eq(retailUnits.teamId, team.id)));
    return Response.json({ success: true });
  } catch (error) {
    return toHttpError(error);
  }
}
