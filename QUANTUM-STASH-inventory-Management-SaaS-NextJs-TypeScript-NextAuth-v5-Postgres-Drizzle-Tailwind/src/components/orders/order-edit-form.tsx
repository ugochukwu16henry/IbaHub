"use client"

import * as React from "react"

export function OrderEditForm({ order, onSaved, onCancel }: { order: any, onSaved: () => void, onCancel: () => void }) {
  const [items, setItems] = React.useState(order.items ? (Array.isArray(order.items) ? order.items.join(", ") : order.items) : "")
  const [total, setTotal] = React.useState(order.total?.toString() || "")
  const [status, setStatus] = React.useState(order.status || "")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.split(",").map((i) => i.trim()),
          total: parseFloat(total),
          status,
        }),
      })
      if (!res.ok) throw new Error("Failed to update order")
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      <input
        type="text"
        placeholder="Items (comma separated)"
        value={items}
        onChange={(e) => setItems(e.target.value)}
        className="border px-2 py-1 rounded"
        required
      />
      <input
        type="number"
        placeholder="Total"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        className="border px-2 py-1 rounded"
        required
        step="0.01"
      />
      <input
        type="text"
        placeholder="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border px-2 py-1 rounded"
        required
      />
      <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
      <button type="button" className="bg-gray-400 text-white px-3 py-1 rounded" onClick={onCancel} disabled={loading}>
        Cancel
      </button>
      {error && <span className="text-red-500 ml-2">{error}</span>}
    </form>
  )
}
