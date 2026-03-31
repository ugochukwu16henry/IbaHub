type QuestPdfRenderRequest = {
  template: string;
  title: string;
  reference: string;
  issuedAtIso: string;
  currency: string;
  totals: {
    gross: number;
    fee?: number;
    net?: number;
  };
  parties: {
    from: string;
    to: string;
  };
  lineItems: Array<{
    label: string;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
  }>;
  notes?: string;
};

function getServiceUrl() {
  return (
    process.env.PDF_SERVICE_URL ||
    'http://localhost:7071'
  ).replace(/\/+$/, '');
}

export async function renderPdfWithQuestPdf(payload: QuestPdfRenderRequest) {
  const endpoint = `${getServiceUrl()}/v1/documents/render`;
  const token = process.env.PDF_SERVICE_TOKEN || '';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`PDF_RENDER_FAILED:${response.status}:${reason.slice(0, 300)}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return bytes;
}

export type { QuestPdfRenderRequest };
