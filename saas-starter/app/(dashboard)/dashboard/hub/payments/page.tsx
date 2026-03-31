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
  DOMAIN_PAYMENT_SLOTS,
  getShellBilling
} from '@/lib/integration/payments-bridge';
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react';

export default function HubPaymentsPage() {
  const shell = getShellBilling();

  return (
    <section className="flex-1 p-4 lg:p-8 max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href="/dashboard/hub">
          <ArrowLeft className="size-4 mr-1" />
          Integration hub
        </Link>
      </Button>
      <h1 className="text-lg lg:text-2xl font-medium mb-2">
        Payments &amp; fintech (§3.7)
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Unified shell billing (Paystack) plus placeholders for domain wallets and
        local providers. Wire each backend, then forward settlement webhooks to{' '}
        <code className="text-xs bg-gray-100 px-0.5 rounded">
          /api/webhooks/payments/domain
        </code>
        .
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="size-4" />
            Shell billing (Paystack)
          </CardTitle>
          <CardDescription>
            Team subscription and checkout live on the core platform (
            {shell.provider}).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={shell.pricingPath}>Pricing</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={shell.teamSettingsPath}>Organization &amp; subscription</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hub/payments/payouts">Admin payouts</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hub/payments/finance">Finance &amp; audit</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/hub/payments/reviews">Review moderation</Link>
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Wallet className="size-4" />
        Domain payment modes
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Set optional env flags per backend (e.g. <code>paystack</code>,{' '}
        <code>wallet</code>, <code>manual</code>). Implement capture in each
        service; the shell only coordinates identity and tenant headers.
      </p>
      <ul className="space-y-3">
        {DOMAIN_PAYMENT_SLOTS.map((slot) => (
          <li key={slot.id}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{slot.label}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {slot.modeEnvKey}
                </CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Domain payout webhook</CardTitle>
          <CardDescription>
            POST JSON with header matching{' '}
            <code className="text-xs">INTEGRATION_PAYMENTS_WEBHOOK_SECRET</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="text-xs font-mono text-muted-foreground">
            /api/webhooks/payments/domain
          </p>
          <p className="text-xs text-muted-foreground">
            Include <code className="bg-gray-100 px-0.5 rounded">teamId</code> in
            JSON or <code className="bg-gray-100 px-0.5 rounded">X-IbaHub-Team-Id</code>{' '}
            to append a row to that organization's activity log (same for the generic
            integration webhook).
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
