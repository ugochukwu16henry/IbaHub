import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { retailUnits } from '@/lib/db/schema';
import { requireRetailContext, toHttpError } from '@/lib/retail/auth';
import { readJson } from '@/app/api/retail/_shared';

const schema = z.object({ name: z.string().min(1), abbreviation: z.string().optional() });

export async function GET() {
  try {
    const { team } = await requireRetailContext();
    const rows = await db
      .select()
      .from(retailUnits)
      .where(eq(retailUnits.teamId, team.id))
      .orderBy(desc(retailUnits.createdAt));
    return Response.json(rows);
  } catch (error) {
    return toHttpError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { team } = await requireRetailContext({ ownerWrite: true });
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) return Response.json({ error: 'Invalid payload' }, { status: 400 });
    const [row] = await db.insert(retailUnits).values({ teamId: team.id, ...parsed.data }).returning();
    return Response.json(row, { status: 201 });
  } catch (error) {
    return toHttpError(error);
  }
}
