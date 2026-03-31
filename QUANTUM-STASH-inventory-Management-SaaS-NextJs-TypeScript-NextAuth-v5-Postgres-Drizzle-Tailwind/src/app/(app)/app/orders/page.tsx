import { OrderList } from "@/components/orders/order-list"

export default function OrdersPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      <OrderList />
    </div>
  )
}
