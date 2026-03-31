import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { retailCategories } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { readJson } from '@/app/api/retail/_shared';

const schema = z.object({ name: z.string().min(1), description: z.string().optional() });

export async function GET() {
  try {
    const { team } = await requireRetailContext();
    const data = await db
      .select()
      .from(retailCategories)
      .where(eq(retailCategories.teamId, team.id))
      .orderBy(desc(retailCategories.createdAt));
    return Response.json(data);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return Response.json({ error: 'Invalid payload' }, { status: 400 });
    const [row] = await db
      .insert(retailCategories)
      .values({ teamId: team.id, ...parsed.data })
      .returning();
    return Response.json(row, { status: 201 });
  } catch (error) {
    return toHttpError(error);
  }
}
