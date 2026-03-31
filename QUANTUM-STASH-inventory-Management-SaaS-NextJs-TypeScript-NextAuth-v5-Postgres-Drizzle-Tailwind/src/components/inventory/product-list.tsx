"use client"

import * as React from "react"
import { ProductCreateForm } from "./product-create-form"
import { ProductEditForm } from "./product-edit-form"

export function ProductList() {
  const [products, setProducts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<number | null>(null)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const fetchProducts = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/products")
      if (!res.ok) throw new Error("Failed to fetch products")
      const data = await res.json()
      setProducts(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Search filter
  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
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
      <ProductCreateForm onCreated={fetchProducts} />
      <div className="flex flex-wrap gap-2 mb-2 items-end">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="border px-2 py-1 rounded"
        />
      </div>
      {loading && <div>Loading products...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && !paginated.length && <div>No products found.</div>}
      {!loading && !error && paginated.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Category</th>
                <th className="border px-2 py-1">Brand</th>
                <th className="border px-2 py-1">SKU</th>
                <th className="border px-2 py-1">Price</th>
                <th className="border px-2 py-1">Quantity</th>
                <th className="border px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <React.Fragment key={p.id}>
                  {editId === p.id ? (
                    <tr>
                      <td colSpan={7} className="border px-2 py-1 bg-gray-50">
                        <ProductEditForm
                          product={p}
                          onSaved={() => {
                            setEditId(null)
                            fetchProducts()
                          }}
                          onCancel={() => setEditId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="border px-2 py-1">{p.name}</td>
                      <td className="border px-2 py-1">{p.category}</td>
                      <td className="border px-2 py-1">{p.brand}</td>
                      <td className="border px-2 py-1">{p.sku}</td>
                      <td className="border px-2 py-1">{p.sellingPrice}</td>
                      <td className="border px-2 py-1">{p.quantity}</td>
                      <td className="border px-2 py-1 flex gap-2">
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => setEditId(p.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={async () => {
                            if (!window.confirm("Delete this product?")) return
                            await fetch(`/api/products/${p.id}`, { method: "DELETE" })
                            fetchProducts()
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
