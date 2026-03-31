"use client"

import * as React from "react"
import { ProductCreateForm } from "./product-create-form"
import { ProductEditForm } from "./product-edit-form"

export function ProductList() {
  const [products, setProducts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchProducts = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/products")
      if (!res.ok) throw new Error("Failed to fetch products")
      const data = await res.json()
      setProducts(data)
      const [products, setProducts] = React.useState<any[]>([])
      const [loading, setLoading] = React.useState(true)
      const [error, setError] = React.useState<string | null>(null)
      const [editId, setEditId] = React.useState<number | null>(null)

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

      return (
        <>
          <ProductCreateForm onCreated={fetchProducts} />
          {loading && <div>Loading products...</div>}
          {error && <div className="text-red-500">Error: {error}</div>}
          {!loading && !error && !products.length && <div>No products found.</div>}
          {!loading && !error && products.length > 0 && (
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
                  {products.map((p) => (
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
        </>
      )
    }
