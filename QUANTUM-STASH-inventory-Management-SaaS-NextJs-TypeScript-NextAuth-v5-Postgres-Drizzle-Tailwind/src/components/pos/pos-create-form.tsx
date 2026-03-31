"use client"

import * as React from "react"

export function POSCreateForm({ onCreated }: { onCreated: () => void }) {
  const [orderId, setOrderId] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: Number(orderId),
          amount: parseFloat(amount),
          paymentMethod,
          status,
        }),
      })
      if (!res.ok) throw new Error("Failed to create POS record")
      setOrderId("")
      setAmount("")
      setPaymentMethod("")
      setStatus("")
      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2 items-end">
      <input
        type="number"
        placeholder="Order ID"
        value={orderId}
        onChange={e => setOrderId(e.target.value)}
        className="border px-2 py-1 rounded"
        required
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="border px-2 py-1 rounded"
        required
        step="0.01"
      />
      <input
        type="text"
        placeholder="Payment Method"
        value={paymentMethod}
        onChange={e => setPaymentMethod(e.target.value)}
        className="border px-2 py-1 rounded"
        required
      />
      <input
        type="text"
        placeholder="Status"
        value={status}
        onChange={e => setStatus(e.target.value)}
        className="border px-2 py-1 rounded"
        required
      />
      <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded" disabled={loading}>
        {loading ? "Creating..." : "Create POS"}
      </button>
      {error && <span className="text-red-500 ml-2">{error}</span>}
    </form>
  )
}
