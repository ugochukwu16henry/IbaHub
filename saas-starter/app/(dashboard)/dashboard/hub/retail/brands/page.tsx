import { EntityManager } from '@/components/retail/entity-manager';

export default function RetailBrandsPage() {
  return (
    <EntityManager
      title="Brands"
      endpoint="/api/retail/brands"
      fields={[{ name: 'name', label: 'Brand name' }]}
    />
  );
}
