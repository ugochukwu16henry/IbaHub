"use client"

import * as React from "react"
import { InventoryCreateForm } from "./inventory-create-form"
import { InventoryEditForm } from "./inventory-edit-form"

export function InventoryList() {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const pageSize = 10

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

  // Search filter
  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.sku && item.sku.toLowerCase().includes(q)) ||
      (item.brand && item.brand.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    )
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  React.useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages])

  return (
    <>
      <InventoryCreateForm onCreated={fetchItems} />
      <div className="flex flex-wrap gap-2 mb-2 items-end">
        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="border px-2 py-1 rounded"
        />
      </div>
      {loading && <div>Loading inventory...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && !paginated.length && <div>No inventory found.</div>}
      {!loading && !error && paginated.length > 0 && (
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
              {paginated.map((item) => (
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
      {/* Pagination controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex gap-2 mt-2">
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </>
  )
}
