import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DOMAIN_DATA_LABELS } from '@/lib/integration/domain-data';
import type { IntegrationServiceId } from '@/lib/integration/services';
import { ArrowLeft } from 'lucide-react';

const SERVICES: IntegrationServiceId[] = ['logistics', 'gig', 'retail'];

export default function DomainDataIndexPage() {
  return (
    <section className="flex-1 p-4 lg:p-8 max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub">
          <ArrowLeft className="size-4 mr-1" />
          Integration hub
        </Link>
      </Button>
      <h1 className="text-lg lg:text-2xl font-medium mb-2">Domain data</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Deeper integration: fetch primary list endpoints through the gateway
        (INTEGRATION_PLAN §3.5–3.6). Paths default to common REST shapes; set{' '}
        <code className="text-xs bg-gray-100 px-0.5 rounded">
          INTEGRATION_*_LIST_PATH
        </code>{' '}
        to match each backend.
      </p>
      <ul className="space-y-3">
        {SERVICES.map((id) => (
          <li key={id}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {DOMAIN_DATA_LABELS[id].title}
                </CardTitle>
                <CardDescription>{DOMAIN_DATA_LABELS[id].planRef}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/hub/data/${id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
