import { isOwnerAdmin } from '@/lib/admin/auth';
import { getFinanceOverviewData } from '@/lib/admin/finance-data';
import { processDuePayouts } from '@/lib/payments/rider-payouts';

export const runtime = 'nodejs';

export async function GET() {
  await processDuePayouts();
  const allowed = await isOwnerAdmin();
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });
  return Response.json(await getFinanceOverviewData());
}

