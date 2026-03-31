"use client"

import * as React from "react"
import { InventoryCreateForm } from "./inventory-create-form"
import { InventoryEditForm } from "./inventory-edit-form"

export function InventoryList() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<number | null>(null)

  const fetchItems = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/inventory")
      if (!res.ok) throw new Error("Failed to fetch inventory")
      const data = await res.json()
      setItems(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return (
    <>
      <InventoryCreateForm onCreated={fetchItems} />
      {loading && <div>Loading inventory...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && !items.length && <div>No inventory found.</div>}
      {!loading && !error && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Category</th>
                <th className="border px-2 py-1">Brand</th>
                <th className="border px-2 py-1">SKU</th>
                <th className="border px-2 py-1">Quantity</th>
                <th className="border px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <React.Fragment key={item.id}>
                  {editId === item.id ? (
                    <tr>
                      <td colSpan={6} className="border px-2 py-1 bg-gray-50">
                        <InventoryEditForm
                          item={item}
                          onSaved={() => {
                            setEditId(null)
                            fetchItems()
                          }}
                          onCancel={() => setEditId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="border px-2 py-1">{item.name}</td>
                      <td className="border px-2 py-1">{item.category}</td>
                      <td className="border px-2 py-1">{item.brand}</td>
                      <td className="border px-2 py-1">{item.sku}</td>
                      <td className="border px-2 py-1">{item.quantity}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => setEditId(item.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={async () => {
                            if (!window.confirm("Delete this inventory item?")) return
                            await fetch(`/api/inventory/${item.id}`, { method: "DELETE" })
                            fetchItems()
                          }}
                        >
                          Delete
                        </button>
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
