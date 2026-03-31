import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { REPO_AUDIT_CHECKLIST } from '@/lib/integration/repo-audit';
import { ArrowLeft, ListOrdered } from 'lucide-react';

export default function RepoAuditPage() {
  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub/roadmap">
          <ArrowLeft className="size-4 mr-1" />
          Harmonization roadmap
        </Link>
      </Button>

      <h1 className="text-lg lg:text-2xl font-medium mb-2">Repo audit</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        <strong className="text-foreground">INTEGRATION_PLAN.md</strong> §6.1:
        audit each repo for modularity and API readiness. Use this checklist
        while reviewing code under the IbaHub workspace; folder names are
        relative to the repo root.
      </p>

      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/dashboard/hub/roadmap">
          <ListOrdered className="size-4 mr-2" />
          Back to §3 roadmap
        </Link>
      </Button>

      <ul className="space-y-4">
        {REPO_AUDIT_CHECKLIST.map((repo) => (
          <li key={repo.folder}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-mono">{repo.folder}</CardTitle>
                <CardDescription>{repo.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {repo.checks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
