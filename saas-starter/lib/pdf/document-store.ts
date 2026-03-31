import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { generatedDocuments } from '@/lib/db/schema';

type StorePdfInput = {
  teamId?: number | null;
  userId?: number | null;
  sourceKind: string;
  sourceId?: number | null;
  documentType: 'receipt' | 'invoice';
  title: string;
  reference: string;
  pdfBytes: Buffer;
};

export async function storeGeneratedPdf(input: StorePdfInput) {
  const [row] = await db
    .insert(generatedDocuments)
    .values({
      teamId: input.teamId ?? null,
      userId: input.userId ?? null,
      sourceKind: input.sourceKind,
      sourceId: input.sourceId ?? null,
      documentType: input.documentType,
      title: input.title,
      reference: input.reference,
      mimeType: 'application/pdf',
      contentBase64: input.pdfBytes.toString('base64')
    })
    .returning();
  return row;
}

export async function getLatestGeneratedPdfBySource(sourceKind: string, sourceId: number) {
  const [row] = await db
    .select()
    .from(generatedDocuments)
    .where(and(eq(generatedDocuments.sourceKind, sourceKind), eq(generatedDocuments.sourceId, sourceId)))
    .orderBy(desc(generatedDocuments.id))
    .limit(1);
  return row ?? null;
}
