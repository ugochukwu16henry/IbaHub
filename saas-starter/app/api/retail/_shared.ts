import { z } from 'zod';

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error('INVALID_JSON');
  }
}

export function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) throw new Error('INVALID_ID');
  return id;
}

export function toKobo(naira: number) {
  return Math.round(Math.max(0, naira) * 100);
}

export const itemInputSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  brandId: z.number().int().positive().optional(),
  unitId: z.number().int().positive().optional(),
  warehouseId: z.number().int().positive().optional(),
  quantity: z.number().int().min(0).default(0),
  reorderPoint: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).optional(),
  details: z.record(z.string(), z.string()).optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.string().min(1),
        extraPriceNaira: z.number().min(0).optional(),
        stock: z.number().int().min(0).optional()
      })
    )
    .optional(),
  purchasePriceNaira: z.number().min(0),
  sellingPriceNaira: z.number().min(0)
});

export const posInputSchema = z.object({
  idempotencyKey: z.string().min(6),
  paymentMethod: z.string().min(2).default('cash'),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  notes: z.string().optional(),
  discountKobo: z.number().int().min(0).optional(),
  taxKobo: z.number().int().min(0).optional(),
  lines: z.array(z.object({ itemId: z.number().int().positive(), quantity: z.number().int().positive() })).min(1)
});
