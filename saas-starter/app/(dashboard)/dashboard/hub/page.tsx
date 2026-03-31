import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getIntegrationHubSummary } from '@/lib/integration/services';
import { ArrowRight, CheckCircle2, CircleDashed } from 'lucide-react';

export default function IntegrationHubPage() {
  const services = getIntegrationHubSummary();

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl">
      <h1 className="text-lg lg:text-2xl font-medium mb-2">Integration hub</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
        Modular domains from the IbaHub plan. Configure upstream API base URLs
        in environment variables, then call them through the authenticated
        gateway under{' '}
        <code className="text-xs bg-gray-100 px-1 rounded">
          /api/gateway/&lt;service&gt;/…
        </code>
        .
      </p>
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
