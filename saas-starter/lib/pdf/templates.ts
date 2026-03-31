import type { QuestPdfRenderRequest } from '@/lib/pdf/questpdf-client';

type LineItem = QuestPdfRenderRequest['lineItems'][number];

const BRAND_NAME = process.env.IBAHUB_DOC_BRAND_NAME || 'IbaHub';
const DEFAULT_CURRENCY = process.env.IBAHUB_DOC_CURRENCY || 'NGN';

type BuildDocumentInput = {
  template: 'payment_receipt' | 'invoice';
  title: string;
  reference: string;
  issuedAtIso?: string;
  gross: number;
  fee?: number;
  net?: number;
  from: string;
  to: string;
  lineItems: LineItem[];
  notes?: string;
};

export function buildPaymentDocumentPayload(input: BuildDocumentInput): QuestPdfRenderRequest {
  return {
    template: input.template,
    title: `${BRAND_NAME} - ${input.title}`,
    reference: input.reference,
    issuedAtIso: input.issuedAtIso ?? new Date().toISOString(),
    currency: DEFAULT_CURRENCY,
    totals: {
      gross: input.gross,
      fee: input.fee,
      net: input.net
    },
    parties: {
      from: input.from,
      to: input.to
    },
    lineItems: input.lineItems,
    notes: input.notes
  };
}
