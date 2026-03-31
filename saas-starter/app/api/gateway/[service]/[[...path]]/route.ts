import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getIntegrationBaseUrl,
  type IntegrationServiceId
} from '@/lib/integration/services';

export const runtime = 'nodejs';

const ALLOW_FORWARD_HEADERS = [
  'content-type',
  'accept',
  'accept-language',
  'authorization',
  'x-request-id'
];

function isIntegrationServiceId(s: string): s is IntegrationServiceId {
  return s === 'logistics' || s === 'gig' || s === 'retail';
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ service: string; path?: string[] }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { service, path: pathSegments } = await context.params;
  if (!isIntegrationServiceId(service)) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 404 });
  }

  const base = getIntegrationBaseUrl(service);
  if (!base) {
    return NextResponse.json(
      { error: 'Service not configured', service },
      { status: 503 }
    );
  }

  const suffix = pathSegments?.length ? pathSegments.join('/') : '';
  const target = `${base}/${suffix}${request.nextUrl.search}`;

  const forwardHeaders = new Headers();
  for (const name of ALLOW_FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) forwardHeaders.set(name, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { error: 'Upstream request failed', target },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('transfer-encoding');

  const body =
    upstream.status === 204 || upstream.status === 304
      ? null
      : await upstream.arrayBuffer();

  return new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}

export function GET(
  request: NextRequest,
  context: { params: Promise<{ service: string; path?: string[] }> }
) {
  return proxy(request, context);
}

export function POST(
  request: NextRequest,
  context: { params: Promise<{ service: string; path?: string[] }> }
) {
  return proxy(request, context);
}

export function PUT(
  request: NextRequest,
  context: { params: Promise<{ service: string; path?: string[] }> }
) {
  return proxy(request, context);
}

export function PATCH(
  request: NextRequest,
  context: { params: Promise<{ service: string; path?: string[] }> }
) {
  return proxy(request, context);
}

export function DELETE(
  request: NextRequest,
  context: { params: Promise<{ service: string; path?: string[] }> }
) {
  return proxy(request, context);
}
