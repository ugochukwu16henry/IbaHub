import Link from 'next/link';

const LINKS = [
  ['Overview', '/dashboard/hub/retail'],
  ['Items', '/dashboard/hub/retail/items'],
  ['Categories', '/dashboard/hub/retail/categories'],
  ['Brands', '/dashboard/hub/retail/brands'],
  ['Units', '/dashboard/hub/retail/units'],
  ['Warehouses', '/dashboard/hub/retail/warehouses'],
  ['Orders', '/dashboard/hub/retail/orders'],
  ['POS', '/dashboard/hub/retail/pos'],
  ['Purchase Requests', '/dashboard/hub/retail/purchase-requests'],
  ['Adjustments', '/dashboard/hub/retail/inventory-adjustments']
] as const;

export function RetailNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
