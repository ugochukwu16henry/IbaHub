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

  const configuredCount = services.filter((s) => s.configured).length;
  const allConfigured = configuredCount === services.length;

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-5xl space-y-8">
      <header>
        <h1 className="text-lg lg:text-2xl font-medium mb-2">IbaHub command center</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Central home for{' '}
          <strong className="text-foreground">INTEGRATION_PLAN.md</strong> execution — gateway, domains,
          webhooks, tenants, and payments. Configure upstream APIs, map tenants, then exercise domain
          flows through the authenticated gateway.
        </p>
      </header>

      {/* Status strip */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Domains
            </CardTitle>
            <CardDescription className="text-xs">
              {configuredCount}/{services.length} configured
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Base URLs in .env</span>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/hub/data">Open domain data</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Health & mocks
            </CardTitle>
            <CardDescription className="text-xs">
              Check upstream health & local mocks
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">/api/integration/health</span>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/hub/roadmap">View roadmap</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Tenants & SSO
            </CardTitle>
            <CardDescription className="text-xs">
              Team ↔ service org IDs · optional OIDC
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-xs">
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/hub/tenants">Tenant mappings</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/sign-in">Auth & SSO</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Health & navigation */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                Gateway health by domain
              </CardTitle>
              <CardDescription className="text-xs">
                Mirrors <code className="bg-gray-100 px-0.5 rounded text-[10px]">/api/integration/health</code>;
                each row calls the configured upstream health endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationHubHealth items={healthItems} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="size-4" />
                Webhooks & activity
              </CardTitle>
              <CardDescription className="text-xs">
                POST{' '}
                <code className="bg-gray-100 px-0.5 rounded text-[10px]">
                  /api/webhooks/integration
                </code>{' '}
                and{' '}
                <code className="bg-gray-100 px-0.5 rounded text-[10px]">
                  /api/webhooks/payments/domain
                </code>{' '}
                with team IDs persist to activity logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Header secrets from .env; Idempotency-Key dedupes inbound events.</span>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/activity">View activity</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4" />
                Shell billing
              </CardTitle>
              <CardDescription className="text-xs">
                Subscription lives in the shell (Paystack); domain payouts stay inside each
                backend until unified.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-xs">
              <Button size="sm" variant="outline" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/hub/payments">Domain payouts</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Domain overview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Domains & gateways</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/hub/slices/logistics">Logistics slice</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/hub/slices/gig">Gig slice</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/hub/slices/retail">Retail slice</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/hub/riders">Rider verification</Link>
            </Button>
          </div>
        </div>
        <ul className="space-y-3">
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
                <CardContent className="pt-0 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/hub/${s.id}`}>
                      Details
                      <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs" asChild>
                    <Link href={`/dashboard/hub/data/${s.id}`}>Open list</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {/* Plan links */}
      <footer className="pt-2 border-t mt-4 border-gray-100">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
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
        </div>
      </footer>
    </section>
  );
}
