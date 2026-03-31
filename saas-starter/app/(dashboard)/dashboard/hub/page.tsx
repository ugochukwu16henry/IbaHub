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
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  Webhook,
  ListOrdered,
  ClipboardCheck
} from 'lucide-react';

export default function IntegrationHubPage() {
  const services = getIntegrationHubSummary();
  const healthItems = INTEGRATION_SERVICES.map((s) => ({
    id: s.id,
    label: s.label
  }));

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl">
      <h1 className="text-lg lg:text-2xl font-medium mb-2">Integration hub</h1>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Execution layer for <strong className="text-foreground">INTEGRATION_PLAN.md</strong> (§2
        architecture, §3 harmonization, §5 domain matrix). Configure upstream
        API base URLs, then call the authenticated gateway at{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">
          /api/gateway/&lt;service&gt;/…
        </code>
        . Headers include <code className="text-xs bg-gray-100 px-1 rounded">X-IbaHub-User-Id</code>,{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">X-IbaHub-Team-Id</code>, and optional org
        IDs from{' '}
        <Link href="/dashboard/hub/tenants" className="underline">
          tenant mappings
        </Link>
        .
      </p>
      <div className="flex flex-wrap gap-2 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/hub/roadmap">
            <ListOrdered className="size-3.5 mr-1" />
            §3 Roadmap &amp; §5 matrix
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/hub/audit">
            <ClipboardCheck className="size-3.5 mr-1" />
            §6.1 Repo audit
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/hub/data">Domain data (§3.5–3.6)</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/hub/payments">Payments (§3.7)</Link>
        </Button>
      </div>

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
                <p className="text-xs text-muted-foreground pt-1">
                  Plan: {s.planRefs.join(', ')} · Repos:{' '}
                  <span className="font-mono">{s.sourceRepos.join(', ')}</span>
                </p>
                <p className="text-xs text-muted-foreground font-mono pt-0.5">
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
