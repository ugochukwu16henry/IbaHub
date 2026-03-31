'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import useSWR from 'swr';
import { TeamDataWithMembers } from '@/lib/db/schema';
import { parseIntegrationMappings } from '@/lib/integration/mappings';
import { updateIntegrationMappings } from '../actions';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ActionState = { error?: string; success?: string };

export default function TenantMappingsPage() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateIntegrationMappings,
    {}
  );
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const mapped = parseIntegrationMappings(team?.integrationMappings ?? null);
  const formKey = team
    ? `${team.id}-${team.integrationMappings ?? ''}`
    : 'loading';

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub">
          <ArrowLeft className="size-4 mr-1" />
          Integration hub
        </Link>
      </Button>
      <h1 className="text-lg lg:text-2xl font-medium mb-6">
        Team ↔ service tenants
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Upstream tenant IDs</CardTitle>
          <CardDescription>
            Map this IbaHub team to organization records in each connected
            backend. Values are forwarded on gateway requests as{' '}
            <code className="text-xs bg-gray-100 px-0.5 rounded">
              X-IbaHub-*-Org-Id
            </code>{' '}
            (team owners only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!team ? (
            <p className="text-sm text-muted-foreground">Loading team…</p>
          ) : (
            <form key={formKey} action={action} className="space-y-4">
              <div>
                <Label htmlFor="logisticsOrgId">Logistics org ID</Label>
                <Input
                  id="logisticsOrgId"
                  name="logisticsOrgId"
                  placeholder="Fleetbase / Mover tenant"
                  defaultValue={mapped?.logisticsOrgId ?? ''}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gigOrgId">Gig org ID</Label>
                <Input
                  id="gigOrgId"
                  name="gigOrgId"
                  placeholder="Ride / gig platform tenant"
                  defaultValue={mapped?.gigOrgId ?? ''}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="retailOrgId">Retail org ID</Label>
                <Input
                  id="retailOrgId"
                  name="retailOrgId"
                  placeholder="Inventory / POS tenant"
                  defaultValue={mapped?.retailOrgId ?? ''}
                  className="mt-1"
                />
              </div>
              {state.error ? (
                <p className="text-sm text-red-600">{state.error}</p>
              ) : null}
              {state.success ? (
                <p className="text-sm text-green-600">{state.success}</p>
              ) : null}
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save tenant IDs'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
