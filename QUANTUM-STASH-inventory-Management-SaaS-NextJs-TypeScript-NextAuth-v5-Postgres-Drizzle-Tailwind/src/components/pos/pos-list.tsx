"use client"

import * as React from "react"
import { POSCreateForm } from "./pos-create-form"
import { POSEditForm } from "./pos-edit-form"

export function POSList() {
  const [records, setRecords] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editId, setEditId] = React.useState<number | null>(null)

  const fetchRecords = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/pos")
      if (!res.ok) throw new Error("Failed to fetch POS records")
      const data = await res.json()
      setRecords(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return (
    <>
      <POSCreateForm onCreated={fetchRecords} />
      {loading && <div>Loading POS records...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      {!loading && !error && !records.length && <div>No POS records found.</div>}
      {!loading && !error && records.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">POS ID</th>
                <th className="border px-2 py-1">Order ID</th>
                <th className="border px-2 py-1">Amount</th>
                <th className="border px-2 py-1">Payment Method</th>
                <th className="border px-2 py-1">Status</th>
                <th className="border px-2 py-1">Created At</th>
                <th className="border px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <React.Fragment key={rec.id}>
                  {editId === rec.id ? (
                    <tr>
                      <td colSpan={7} className="border px-2 py-1 bg-gray-50">
                        <POSEditForm
                          pos={rec}
                          onSaved={() => {
                            setEditId(null)
                            fetchRecords()
                          }}
                          onCancel={() => setEditId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="border px-2 py-1">{rec.id}</td>
                      <td className="border px-2 py-1">{rec.orderId}</td>
                      <td className="border px-2 py-1">{rec.amount}</td>
                      <td className="border px-2 py-1">{rec.paymentMethod}</td>
                      <td className="border px-2 py-1">{rec.status}</td>
                      <td className="border px-2 py-1">{rec.createdAt ? new Date(rec.createdAt).toLocaleString() : ""}</td>
                      <td className="border px-2 py-1">
                        <button className="text-blue-600 hover:underline mr-2" onClick={() => setEditId(rec.id)}>Edit</button>
                        <button className="text-red-600 hover:underline" onClick={async () => {
                          if (confirm("Delete this POS record?")) {
                            await fetch(`/api/pos/${rec.id}`, { method: "DELETE" })
                            fetchRecords()
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
