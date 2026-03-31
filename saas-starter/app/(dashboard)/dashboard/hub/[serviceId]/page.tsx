import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getIntegrationBaseUrl,
  INTEGRATION_SERVICES,
  type IntegrationServiceId
} from '@/lib/integration/services';
import { ArrowLeft, CheckCircle2, CircleDashed } from 'lucide-react';

type Props = { params: Promise<{ serviceId: string }> };

function isIntegrationServiceId(s: string): s is IntegrationServiceId {
  return s === 'logistics' || s === 'gig' || s === 'retail';
}

export default async function IntegrationServicePage({ params }: Props) {
  const { serviceId } = await params;
  if (!isIntegrationServiceId(serviceId)) notFound();

  const meta = INTEGRATION_SERVICES.find((s) => s.id === serviceId)!;
  const base = getIntegrationBaseUrl(serviceId);
  const configured = Boolean(base);

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub">
          <ArrowLeft className="size-4 mr-1" />
          Integration hub
        </Link>
      </Button>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h1 className="text-lg lg:text-2xl font-medium">{meta.label}</h1>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {configured ? (
            <>
              <CheckCircle2 className="size-3.5 text-green-600" />
              Configured
            </>
          ) : (
            <>
              <CircleDashed className="size-3.5" />
              Not configured
            </>
          )}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{meta.description}</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Environment</CardTitle>
          <CardDescription>
            Set in <code className="text-xs">{meta.envKey}</code> (see{' '}
            <code className="text-xs">.env.example</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {configured ? (
            <p>
              Base URL:{' '}
              <code className="text-xs bg-gray-100 px-1 rounded break-all">
                {base}
              </code>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Add the URL to your <code className="text-xs">.env</code> and
              restart the dev server.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">API gateway</CardTitle>
          <CardDescription>
            Authenticated requests are proxied from the platform shell to the
            upstream service.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm font-mono space-y-2 break-all">
          <p>
            <span className="text-muted-foreground">Pattern:</span>{' '}
            {`/api/gateway/${serviceId}/…`}
          </p>
          <p className="text-muted-foreground text-xs font-sans">
            Example:{' '}
            <code>{`GET /api/gateway/${serviceId}/health`}</code> →{' '}
            <code>{configured ? `${base}/health` : '<base>/health'}</code>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
