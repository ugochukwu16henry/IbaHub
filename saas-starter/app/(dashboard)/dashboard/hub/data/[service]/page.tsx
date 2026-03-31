import { notFound } from 'next/navigation';
import { DomainDataPanel } from '@/components/integration/domain-data-panel';
import type { IntegrationServiceId } from '@/lib/integration/services';

function isService(s: string): s is IntegrationServiceId {
  return s === 'logistics' || s === 'gig' || s === 'retail';
}

type Props = { params: Promise<{ service: string }> };

export default async function DomainDataServicePage({ params }: Props) {
  const { service } = await params;
  if (!isService(service)) notFound();
  return <DomainDataPanel service={service} />;
}
