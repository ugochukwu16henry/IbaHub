"use client"

import * as React from "react"

export function ProductList() {
  const [products, setProducts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchProducts() {
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
    }
    fetchProducts()
  }, [])

  if (loading) return <div>Loading products...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>
  if (!products.length) return <div>No products found.</div>

  return (
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
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.name}</td>
              <td className="border px-2 py-1">{p.category}</td>
              <td className="border px-2 py-1">{p.brand}</td>
              <td className="border px-2 py-1">{p.sku}</td>
              <td className="border px-2 py-1">{p.sellingPrice}</td>
              <td className="border px-2 py-1">{p.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
