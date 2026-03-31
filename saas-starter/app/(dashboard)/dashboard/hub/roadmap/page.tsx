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
  HARMONIZATION_STEPS,
  PLAN_NEXT_STEPS
} from '@/lib/integration/harmonization';
import { DOMAIN_MATRIX } from '@/lib/integration/domain-matrix';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';

function statusLabel(status: string) {
  switch (status) {
    case 'done':
      return 'Done';
    case 'partial':
      return 'In progress';
    default:
      return 'Planned';
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'done':
      return 'bg-green-100 text-green-900';
    case 'partial':
      return 'bg-amber-100 text-amber-900';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function PlanRoadmapPage() {
  return (
    <section className="flex-1 p-4 lg:p-8 max-w-4xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub">
          <ArrowLeft className="size-4 mr-1" />
          Integration hub
        </Link>
      </Button>

      <h1 className="text-lg lg:text-2xl font-medium mb-2">
        Harmonization roadmap
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
        This page tracks{' '}
        <strong className="text-foreground">INTEGRATION_PLAN.md</strong> §3
        (steps 1–8) and §5 (domain matrix). Source of truth remains the markdown
        file at the IbaHub repository root; status here is maintained alongside
        code.
      </p>

      <div className="mb-8">
        <Button variant="outline" size="sm" asChild className="mb-6">
          <Link href="/dashboard/hub/audit">
            <ClipboardCheck className="size-4 mr-2" />
            Repo audit checklist (§6.1)
          </Link>
        </Button>

        <h2 className="text-base font-semibold text-gray-900 mb-3">
          §3 Step-by-step harmonization
        </h2>
        <ol className="space-y-4">
          {HARMONIZATION_STEPS.map((s) => (
            <li key={s.step}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      Step {s.step}: {s.title}
                    </CardTitle>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${statusClass(
                        s.status
                      )}`}
                    >
                      {statusLabel(s.status)}
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {s.implementationHint ? (
                    <CardDescription className="pt-2 text-xs">
                      Implementation: {s.implementationHint}
                    </CardDescription>
                  ) : null}
                </CardHeader>
              </Card>
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          §5 Summary table (domain matrix)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 font-medium">Domain</th>
                <th className="px-3 py-2 font-medium">Source repo(s)</th>
                <th className="px-3 py-2 font-medium">Features</th>
                <th className="px-3 py-2 font-medium">Approach</th>
              </tr>
            </thead>
            <tbody>
              {DOMAIN_MATRIX.map((row) => (
                <tr key={row.domain} className="border-t border-gray-100">
                  <td className="px-3 py-2 align-top font-medium">{row.domain}</td>
                  <td className="px-3 py-2 align-top font-mono text-xs">
                    {row.sourceRepos.join(', ')}
                  </td>
                  <td className="px-3 py-2 align-top text-muted-foreground">
                    {row.keyFeatures}
                  </td>
                  <td className="px-3 py-2 align-top text-muted-foreground">
                    {row.approach}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">§6 Next steps (plan document)</CardTitle>
          <CardDescription>
            Track these after each harmonization milestone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            {PLAN_NEXT_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}
