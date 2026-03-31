import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IntegrationHubHealth } from '@/components/integration/hub-health';
import { getIntegrationHubSummary, INTEGRATION_SERVICES } from '@/lib/integration/services';
import { ArrowRight, CheckCircle2, CircleDashed, CreditCard, Webhook } from 'lucide-react';

export default function IntegrationHubPage() {
  const services = getIntegrationHubSummary();
  const healthItems = INTEGRATION_SERVICES.map((s) => ({
    id: s.id,
    label: s.label
  }));

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl">
      <h1 className="text-lg lg:text-2xl font-medium mb-2">Integration hub</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        Modular domains from the IbaHub plan. Configure upstream API base URLs
        in environment variables, then call them through the authenticated
        gateway under{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">
          /api/gateway/&lt;service&gt;/…
        </code>
        . The gateway adds <code className="text-xs bg-gray-100 px-1 rounded">X-IbaHub-User-Id</code>,{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">X-IbaHub-Team-Id</code>, and optional org
        headers from{' '}
        <Link href="/dashboard/hub/tenants" className="underline">
          tenant mappings
        </Link>
        .
      </p>

      <IntegrationHubHealth items={healthItems} />

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4" />
              Payments
            </CardTitle>
            <CardDescription>
              Unified billing for the shell lives in Stripe via{' '}
              <Link href="/pricing" className="underline">
                Pricing
              </Link>{' '}
              and team subscription. Wire provider-specific payouts inside each
              backend when those APIs are ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing">Open pricing</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="size-4" />
              Cross-service events
            </CardTitle>
            <CardDescription>
              <span className="text-xs font-mono block">
                POST /api/webhooks/integration
              </span>
              <span className="text-sm text-muted-foreground block mt-1">
                Header <code className="bg-gray-100 px-0.5 rounded">X-IbaHub-Webhook-Secret</code> must
                match <code className="bg-gray-100 px-0.5 rounded">INTEGRATION_INBOUND_WEBHOOK_SECRET</code> in{' '}
                <code className="bg-gray-100 px-0.5 rounded">.env</code>.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Use this as the first hop for event-driven sync before introducing a
            full message bus.
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard/hub/tenants">Tenant mappings</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard/hub/slices/logistics">Logistics slice</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard/hub/slices/gig">Gig slice</Link>
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard/hub/slices/retail">Retail slice</Link>
        </Button>
      </div>

      <ul className="space-y-4">
        {services.map((s) => (
          <li key={s.id}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <CardTitle className="text-base">{s.label}</CardTitle>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    {s.configured ? (
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
                <CardDescription>{s.description}</CardDescription>
                <p className="text-xs text-muted-foreground font-mono pt-1">
                  {s.envKey}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/hub/${s.id}`}>
                    Details
                    <ArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
