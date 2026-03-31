"use client"

import * as React from "react"

export function InventoryEditForm({ item, onSaved, onCancel }: {
  item: any,
  onSaved?: () => void,
  onCancel?: () => void
}) {
  const [form, setForm] = React.useState({ ...item })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update inventory item")
      }
      setSuccess("Inventory item updated!")
      if (onSaved) onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded">
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        className="border px-2 py-1 rounded"
        required
      />
      <input
        name="category"
        value={form.category}
        onChange={handleChange}
        placeholder="Category"
        className="border px-2 py-1 rounded"
        required
      />
      <input
        name="brand"
        value={form.brand}
        onChange={handleChange}
        placeholder="Brand"
        className="border px-2 py-1 rounded"
        required
      />
      <input
        name="sku"
        value={form.sku}
        onChange={handleChange}
        placeholder="SKU"
        className="border px-2 py-1 rounded"
        required
      />
      <input
        name="quantity"
        value={form.quantity}
        onChange={handleChange}
        placeholder="Quantity"
        type="number"
        min="0"
        step="1"
        className="border px-2 py-1 rounded"
        required
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        className="ml-2 px-4 py-1 rounded border border-gray-400"
        onClick={onCancel}
      >
        Cancel
      </button>
      {error && <span className="text-red-500 ml-4">{error}</span>}
      {success && <span className="text-green-600 ml-4">{success}</span>}
    </form>
  )
}
