import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { InventoryList } from "@/components/inventory/inventory-list"

export default async function AppInventoryPage(): Promise<JSX.Element> {
  const session = await auth()
  if (!session) redirect("/signin")

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      <InventoryList />
    </div>
  )
}
