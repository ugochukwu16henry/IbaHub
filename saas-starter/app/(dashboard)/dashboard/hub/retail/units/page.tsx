import { EntityManager } from '@/components/retail/entity-manager';

export default function RetailUnitsPage() {
  return (
    <EntityManager
      title="Units"
      endpoint="/api/retail/units"
      fields={[
        { name: 'name', label: 'Unit name' },
        { name: 'abbreviation', label: 'Abbreviation' }
      ]}
    />
  );
}
