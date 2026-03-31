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

type PaystackRecipientResponse = {
  status: boolean;
  message: string;
  data?: { recipient_code: string };
};

type PaystackTransferResponse = {
  status: boolean;
  message: string;
  data?: { reference: string; status: string };
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
  const signingSecret =
    process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
  if (!signingSecret || !signature) return false;

  const expected = crypto
    .createHmac('sha512', signingSecret)
    .update(rawBody)
    .digest('hex');

  return expected === signature;
}

export async function createPaystackTransferRecipient(input: {
  accountNumber: string;
  bankCode: string;
  name: string;
}) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not set');

  const response = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'nuban',
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: 'NGN'
    }),
    cache: 'no-store'
  });

  const payload = (await response.json()) as PaystackRecipientResponse;
  if (!response.ok || !payload.status || !payload.data?.recipient_code) {
    throw new Error(payload.message || 'Failed to create transfer recipient');
  }
  return payload.data.recipient_code;
}

export async function initiatePaystackTransfer(input: {
  amountKobo: number;
  recipientCode: string;
  reason: string;
  reference: string;
}) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not set');

  const response = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: 'balance',
      amount: input.amountKobo,
      recipient: input.recipientCode,
      reason: input.reason,
      reference: input.reference
    }),
    cache: 'no-store'
  });

  const payload = (await response.json()) as PaystackTransferResponse;
  if (!response.ok || !payload.status) {
    throw new Error(payload.message || 'Failed to initiate payout transfer');
  }
  return payload.data?.reference || input.reference;
}
