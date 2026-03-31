"use client"


import * as React from "react"
import { OrderCreateForm } from "./order-create-form"
import { OrderEditForm } from "./order-edit-form"

type FilterState = {
  status: string
  minTotal: string
  maxTotal: string
  startDate: string
  endDate: string
  searchId: string
}


export function OrderList() {
  const [orders, setOrders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [filters, setFilters] = React.useState<FilterState>({
    status: "",
    minTotal: "",
    maxTotal: "",
    startDate: "",
    endDate: "",
    searchId: "",
  })

  const fetchOrders = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/orders")
      if (!res.ok) throw new Error("Failed to fetch orders")
      const data = await res.json()
      setOrders(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Filtering logic
  const filteredOrders = orders.filter((order) => {
    if (filters.searchId && String(order.id) !== filters.searchId.trim()) return false
    if (filters.status && order.status !== filters.status) return false
    if (filters.minTotal && Number(order.total) < Number(filters.minTotal)) return false
    if (filters.maxTotal && Number(order.total) > Number(filters.maxTotal)) return false
    if (filters.startDate && order.createdAt && new Date(order.createdAt) < new Date(filters.startDate)) return false
    if (filters.endDate && order.createdAt && new Date(order.createdAt) > new Date(filters.endDate)) return false
    return true
  })

  return (
    <>
      <OrderCreateForm onCreated={fetchOrders} />
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <input
          type="text"
          placeholder="Search Order ID"
          value={filters.searchId}
          onChange={e => setFilters(f => ({ ...f, searchId: e.target.value }))}
          className="border px-2 py-1 rounded"
        />
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="number"
          placeholder="Min Total"
          value={filters.minTotal}
          onChange={e => setFilters(f => ({ ...f, minTotal: e.target.value }))}
          className="border px-2 py-1 rounded"
          step="0.01"
        />
        <input
          type="number"
          placeholder="Max Total"
          value={filters.maxTotal}
          onChange={e => setFilters(f => ({ ...f, maxTotal: e.target.value }))}
          className="border px-2 py-1 rounded"
          step="0.01"
        />
        <input
          type="date"
          value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
          className="border px-2 py-1 rounded"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
          className="border px-2 py-1 rounded"
        />
        <button
          className="bg-gray-200 px-2 py-1 rounded"
          onClick={() => setFilters({ status: "", minTotal: "", maxTotal: "", startDate: "", endDate: "", searchId: "" })}
        >
          Reset
        </button>
      </div>
      {loading && <div>Loading orders...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && !filteredOrders.length && <div>No orders found.</div>}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Order ID</th>
                <th className="border px-2 py-1"># Items</th>
                <th className="border px-2 py-1">Items</th>
                <th className="border px-2 py-1">Total</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Created At</th>
                <th className="border px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  {editId === order.id ? (
                    <tr>
                      <td colSpan={7} className="border px-2 py-1 bg-gray-50">
                        <OrderEditForm
                          order={order}
                          onSaved={() => {
                            setEditId(null)
                            fetchOrders()
                          }}
                          onCancel={() => setEditId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="border px-2 py-1">{order.id}</td>
                      <td className="border px-2 py-1">{Array.isArray(order.items) ? order.items.length : 0}</td>
                      <td className="border px-2 py-1">
                        <ul className="list-disc pl-4">
                          {Array.isArray(order.items)
                            ? order.items.map((item: any, idx: number) => (
                                <li key={idx}>{typeof item === "string" ? item : item?.name || JSON.stringify(item)}</li>
                              ))
                            : null}
                        </ul>
                      </td>
                      <td className="border px-2 py-1">{order.total}</td>
                      <td className="border px-2 py-1">{order.status}</td>
                      <td className="border px-2 py-1">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</td>
                      <td className="border px-2 py-1">
                        <button className="text-blue-600 hover:underline mr-2" onClick={() => setEditId(order.id)}>Edit</button>
                        <button className="text-red-600 hover:underline" onClick={async () => {
                          if (confirm("Delete this order?")) {
                            await fetch(`/api/orders/${order.id}`, { method: "DELETE" })
                            fetchOrders()
                          }
                        }}>Delete</button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
