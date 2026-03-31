import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { checkAllIntegrationHealth } from '@/lib/integration/health';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const services = await checkAllIntegrationHealth();
  return NextResponse.json({ services, checkedAt: new Date().toISOString() });
}
