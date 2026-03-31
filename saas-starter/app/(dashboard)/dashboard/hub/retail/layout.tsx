import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RetailNav } from '@/components/retail/retail-nav';

export default function RetailLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex-1 p-4 lg:p-8 space-y-4 max-w-6xl">
      <Link href="/dashboard/hub" className="inline-flex items-center text-sm text-muted-foreground">
        <ArrowLeft className="size-4 mr-1" />
        Integration hub
      </Link>
      <h1 className="text-2xl font-semibold">Retail parity workspace</h1>
      <RetailNav />
      {children}
    </section>
  );
}
