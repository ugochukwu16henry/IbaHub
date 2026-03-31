import { EntityManager } from '@/components/retail/entity-manager';

export default function RetailItemsPage() {
  return (
    <EntityManager
      title="Items / Products"
      endpoint="/api/retail/products"
      fields={[
        { name: 'name', label: 'Name' },
        { name: 'sku', label: 'SKU' },
        { name: 'purchasePriceNaira', label: 'Purchase Price (NGN)', type: 'number' },
        { name: 'sellingPriceNaira', label: 'Selling Price (NGN)', type: 'number' },
        { name: 'quantity', label: 'Quantity', type: 'number' },
        { name: 'reorderPoint', label: 'Reorder Point', type: 'number' }
      ]}
    />
  );
}
