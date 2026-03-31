import { POSList } from "@/components/pos/pos-list"

export default function POSPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">POS Records</h1>
      <POSList />
    </div>
  )
}
