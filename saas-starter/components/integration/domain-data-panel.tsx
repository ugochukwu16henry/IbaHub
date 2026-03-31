import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getValidatedIntegrationBaseUrl } from '@/lib/integration/boundaries';
import {
  DOMAIN_DATA_LABELS,
  getDomainListPath
} from '@/lib/integration/domain-data';
import { integrationGatewayPath } from '@/lib/integration/contracts';
import { gatewayFetch } from '@/lib/integration/server-gateway';
import { INTEGRATION_SERVICES, type IntegrationServiceId } from '@/lib/integration/services';
import { ArrowLeft } from 'lucide-react';

export async function DomainDataPanel({
  service
}: {
  service: IntegrationServiceId;
}) {
  const meta = DOMAIN_DATA_LABELS[service];
  const envKey = INTEGRATION_SERVICES.find((s) => s.id === service)!.envKey;
  const listPath = getDomainListPath(service);
  const validated = getValidatedIntegrationBaseUrl(service);

  let status: number | undefined;
  let bodyPreview: string;
  let error: string | undefined;

  if (!validated.ok) {
    bodyPreview = '';
    if (validated.reason === 'not_configured') {
      error = `Set ${envKey} and optional INTEGRATION_*_LIST_PATH. Default list path: ${listPath}`;
    } else if (validated.reason === 'host_not_allowed') {
      error =
        'Hostname not allowed (INTEGRATION_*_ALLOWED_HOSTS).';
    } else {
      error = 'Invalid upstream URL.';
    }
  } else {
    try {
      const res = await gatewayFetch(service, listPath);
      status = res.status;
      const text = await res.text();
      bodyPreview =
        text.length > 8000 ? `${text.slice(0, 8000)}…` : text || '(empty)';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Request failed';
      bodyPreview = '';
    }
  }

  const gatewayBrowserPath = integrationGatewayPath(
    service,
    ...listPath.split('/').filter(Boolean)
  );

  let parsed: unknown = null;
  if (!error && bodyPreview && !bodyPreview.endsWith('…')) {
    try {
      parsed = JSON.parse(bodyPreview);
    } catch {
      parsed = null;
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub/data">
          <ArrowLeft className="size-4 mr-1" />
          Domain data
        </Link>
      </Button>
      <h1 className="text-lg lg:text-2xl font-medium mb-1">{meta.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{meta.planRef}</p>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Upstream list path</CardTitle>
          <CardDescription className="font-mono text-xs break-all">
            Gateway: {gatewayBrowserPath}
            <br />
            <span className="text-muted-foreground font-sans">
              Override with INTEGRATION_
              {service === 'logistics'
                ? 'LOGISTICS'
                : service === 'gig'
                  ? 'GIG'
                  : 'RETAIL'}
              _LIST_PATH
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response</CardTitle>
          <CardDescription>
            HTTP {status ?? '—'} · JSON below when parseable
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {error ? (
            <p className="text-amber-800">{error}</p>
          ) : (
            <>
              {parsed !== null && typeof parsed === 'object' ? (
                <pre className="text-xs bg-gray-50 border border-gray-100 rounded-md p-3 overflow-x-auto max-h-[480px]">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              ) : (
                <pre className="text-xs bg-gray-50 border border-gray-100 rounded-md p-3 overflow-x-auto whitespace-pre-wrap max-h-[480px]">
                  {bodyPreview}
                </pre>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
