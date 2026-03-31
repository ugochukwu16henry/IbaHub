import { EntityManager } from '@/components/retail/entity-manager';

export default function RetailCategoriesPage() {
  return (
    <EntityManager
      title="Categories"
      endpoint="/api/retail/categories"
      fields={[
        { name: 'name', label: 'Category name' },
        { name: 'description', label: 'Description' }
      ]}
    />
  );
}
