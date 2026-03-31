import { EntityManager } from '@/components/retail/entity-manager';

export default function RetailWarehousesPage() {
  return (
    <EntityManager
      title="Warehouses"
      endpoint="/api/retail/warehouses"
      fields={[
        { name: 'name', label: 'Warehouse name' },
        { name: 'address', label: 'Address' }
      ]}
    />
  );
}
