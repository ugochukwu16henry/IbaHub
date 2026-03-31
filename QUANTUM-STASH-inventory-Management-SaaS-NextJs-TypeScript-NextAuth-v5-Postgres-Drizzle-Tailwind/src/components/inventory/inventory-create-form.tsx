"use client"

import * as React from "react"

export function InventoryCreateForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = React.useState({
    name: "",
    category: "",
    brand: "",
    sku: "",
    quantity: "",
  })
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
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create inventory item")
      }
      setSuccess("Inventory item created!")
      setForm({ name: "", category: "", brand: "", sku: "", quantity: "" })
      if (onCreated) onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-4 items-end">
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
        className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Saving..." : "Add Inventory"}
      </button>
      {error && <span className="text-red-500 ml-4">{error}</span>}
      {success && <span className="text-green-600 ml-4">{success}</span>}
    </form>
  )
}
