import crypto from 'node:crypto';

type InitializeTransactionInput = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    reference: string;
  };
};

export async function initializePaystackTransaction(
  input: InitializeTransactionInput
) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not set');

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      currency: 'NGN',
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
    cache: 'no-store',
  });

  const payload = (await response.json()) as PaystackInitializeResponse;
  if (!response.ok || !payload.status || !payload.data?.authorization_url) {
    throw new Error(payload.message || 'Failed to initialize Paystack transaction');
  }

  return payload.data;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;

  const expected = crypto
    .createHmac('sha512', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expected === signature;
}
