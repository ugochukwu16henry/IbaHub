import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  INTEGRATION_ROUTE_TEMPLATES,
  integrationGatewayPath
} from '@/lib/integration/contracts';
import { getValidatedIntegrationBaseUrl } from '@/lib/integration/boundaries';
import { gatewayFetch } from '@/lib/integration/server-gateway';
import { INTEGRATION_SERVICES, type IntegrationServiceId } from '@/lib/integration/services';
import { getDomainListPath } from '@/lib/integration/domain-data';
import { ArrowLeft } from 'lucide-react';

const SLICE_COPY: Record<
  IntegrationServiceId,
  { title: string; description: string }
> = {
  logistics: {
    title: 'Logistics · vertical slice',
    description:
      'Fleetbase / Mover — first gateway probe using the logistics health template. Adjust paths in lib/integration/contracts.ts when APIs are wired.'
  },
  gig: {
    title: 'Gig · vertical slice',
    description:
      'Ride-hailing / gig flows — probe via the gig health template. Refine routes when LibreTaxi or Uber-Clone backends are connected.'
  },
  retail: {
    title: 'Retail · vertical slice',
    description:
      'QUANTUM-STASH — probe via the retail health template. Replace paths when catalog/POS routes are finalized.'
  }
};

export async function IntegrationVerticalSlice({
  service
}: {
  service: IntegrationServiceId;
}) {
  const copy = SLICE_COPY[service];
  const envKey = INTEGRATION_SERVICES.find((s) => s.id === service)!.envKey;
  const validated = getValidatedIntegrationBaseUrl(service);
  const healthSegments = [...INTEGRATION_ROUTE_TEMPLATES[service].health];
  const healthPath = healthSegments.join('/');

  const listPath = getDomainListPath(service);
  const listSegments = listPath.split('/').filter(Boolean);

  let healthStatus: number | undefined;
  let healthPreview: string;
  let listStatus: number | undefined;
  let listPreview: string;
  let error: string | undefined;

  if (!validated.ok) {
    healthPreview = '';
    listPreview = '';
    if (validated.reason === 'not_configured') {
      error = `Set ${envKey} in .env, then run health checks from the integration hub.`;
    } else if (validated.reason === 'host_not_allowed') {
      error =
        'Upstream hostname is not in INTEGRATION_*_ALLOWED_HOSTS for this service.';
    } else {
      error = 'Invalid INTEGRATION_*_URL.';
    }
  } else {
    try {
      // 1) Probe health (template-based)
      const healthRes = await gatewayFetch(service, healthPath);
      healthStatus = healthRes.status;
      const healthText = await healthRes.text();
      healthPreview =
        healthText.length > 1200
          ? `${healthText.slice(0, 1200)}…`
          : healthText || '(empty body)';

      // 2) Probe primary list endpoint (plan §3.5–§3.6)
      const listRes = await gatewayFetch(service, listPath);
      listStatus = listRes.status;
      const listText = await listRes.text();
      listPreview =
        listText.length > 1200
          ? `${listText.slice(0, 1200)}…`
          : listText || '(empty body)';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Request failed';
      healthPreview = '';
      listPreview = '';
    }
  }

  const browserPath = integrationGatewayPath(service, ...healthSegments);
  const listBrowserPath = integrationGatewayPath(service, ...listSegments);

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub">
          <ArrowLeft className="size-4 mr-1" />
          Integration hub
        </Link>
      </Button>
      <h1 className="text-lg lg:text-2xl font-medium mb-2">{copy.title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{copy.description}</p>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gateway health probe</CardTitle>
            <CardDescription className="font-mono text-xs break-all">
              {browserPath}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {error ? (
              <p className="text-amber-800">{error}</p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  HTTP status:{' '}
                  <span className="font-medium text-foreground">
                    {healthStatus ?? '—'}
                  </span>
                </p>
                <pre className="text-xs bg-gray-50 border border-gray-100 rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                  {healthPreview || '(no body)'}
                </pre>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gateway primary list</CardTitle>
            <CardDescription className="font-mono text-xs break-all">
              {listBrowserPath}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {error ? (
              <p className="text-amber-800">{error}</p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  HTTP status:{' '}
                  <span className="font-medium text-foreground">
                    {listStatus ?? '—'}
                  </span>
                </p>
                <pre className="text-xs bg-gray-50 border border-gray-100 rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                  {listPreview || '(no body)'}
                </pre>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
