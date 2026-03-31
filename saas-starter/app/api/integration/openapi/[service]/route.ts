import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getSession } from '@/lib/auth/session';
import type { IntegrationServiceId } from '@/lib/integration/services';

export const runtime = 'nodejs';

function isServiceId(s: string): s is IntegrationServiceId {
  return s === 'logistics' || s === 'gig' || s === 'retail';
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ service: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { service } = await context.params;
  if (!isServiceId(service)) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 404 });
  }

  const file = join(process.cwd(), 'contracts', 'openapi', `${service}.yaml`);
  try {
    const body = await readFile(file, 'utf8');
    return new NextResponse(body, {
      headers: {
        'content-type': 'application/yaml; charset=utf-8',
        'cache-control': 'private, max-age=60'
      }
    });
  } catch {
    return NextResponse.json({ error: 'OpenAPI stub not found' }, { status: 404 });
  }
}
