import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { buildContractManifest } from '@/lib/integration/contract-manifest';

export const runtime = 'nodejs';

/** JSON manifest: route templates + links to OpenAPI stubs (INTEGRATION_PLAN §3.2). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(buildContractManifest());
}
