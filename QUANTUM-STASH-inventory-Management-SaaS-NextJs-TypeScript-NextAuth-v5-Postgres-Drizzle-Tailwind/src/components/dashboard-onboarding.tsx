"use client"

import * as React from "react"

import { Icons } from "./icons"

const tips = [
  {
    title: "Products",
    desc: "Add, edit, and search products. Use the search bar to quickly find products by name, SKU, brand, or category.",
    icon: <span className="text-blue-700"><svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16"/><path d="M9 21V9"/></svg></span>,
    img: <div className="w-24 h-16 bg-blue-100 rounded flex items-center justify-center text-blue-400">[Product Screenshot]</div>,
  },
  {
    title: "Inventory",
    desc: "Track and update stock levels. Search and paginate through inventory items for efficient management.",
    icon: <span className="text-green-700"><svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg></span>,
    img: <div className="w-24 h-16 bg-green-100 rounded flex items-center justify-center text-green-400">[Inventory Screenshot]</div>,
  },
  {
    title: "Orders",
    desc: "View, filter, and manage orders. Edit or delete orders, and use filters for status, date, or total.",
    icon: <span className="text-yellow-700"><svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 10h8"/><path d="M8 14h6"/></svg></span>,
    img: <div className="w-24 h-16 bg-yellow-100 rounded flex items-center justify-center text-yellow-400">[Orders Screenshot]</div>,
  },
  {
    title: "POS",
    desc: "Record sales, link to orders, and manage payment status and methods.",
    icon: <span className="text-purple-700"><svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="5" y="7" width="14" height="10" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg></span>,
    img: <div className="w-24 h-16 bg-purple-100 rounded flex items-center justify-center text-purple-400">[POS Screenshot]</div>,
  },
]

export function DashboardOnboarding() {
  const [show, setShow] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dashboardOnboardingDismissed") !== "true"
    }
    return true
  })

  const [step, setStep] = React.useState(0)

  const dismiss = () => {
    setShow(false)
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboardOnboardingDismissed", "true")
    }
  }

  if (!show) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4 max-w-2xl mx-auto shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-blue-900 text-lg">Welcome to your Dashboard!</span>
        <button className="text-blue-700 hover:underline text-sm" onClick={dismiss}>
          Dismiss
        </button>
      </div>
      <div className="flex items-center gap-4 mb-2">
        {tips[step].icon}
        <div>
          <span className="font-semibold text-blue-800">{tips[step].title}:</span> {tips[step].desc}
          <div className="mt-2">{tips[step].img}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="px-2 py-1 border rounded text-blue-700 border-blue-300 disabled:opacity-50"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Prev
        </button>
        <button
          className="px-2 py-1 border rounded text-blue-700 border-blue-300 disabled:opacity-50"
          onClick={() => setStep((s) => Math.min(tips.length - 1, s + 1))}
          disabled={step === tips.length - 1}
        >
          Next
        </button>
        <span className="ml-2 text-sm text-blue-700">Step {step + 1} of {tips.length}</span>
      </div>
    </div>
  )
}
