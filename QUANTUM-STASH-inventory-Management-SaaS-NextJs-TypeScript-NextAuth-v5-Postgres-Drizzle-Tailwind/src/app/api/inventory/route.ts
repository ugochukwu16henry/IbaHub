import { NextResponse } from "next/server"
import { db } from "@/db"
import { items } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET: List all inventory items (all products with quantity)
export async function GET() {
  try {
    const all = await db.select().from(items)
    return NextResponse.json(all)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

// POST: Create a new inventory item (product)
export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.name || !data.quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const [created] = await db.insert(items).values({
      name: data.name,
      category: data.category || "",
      brand: data.brand || "",
      barcode: data.barcode || "",
      description: data.description || "",
      sellingPrice: data.sellingPrice || 0,
      purchasePrice: data.purchasePrice || 0,
      taxRate: data.taxRate || 0,
      width: data.width || 0,
      height: data.height || 0,
      depth: data.depth || 0,
      dimensionsUnit: data.dimensionsUnit || "",
      weight: data.weight || 0,
      weightUnit: data.weightUnit || "",
      warehouse: data.warehouse || "",
      sku: data.sku || "",
      quantity: data.quantity,
      unit: data.unit || "",
      reorderPoint: data.reorderPoint || 0,
      supplier: data.supplier || "",
      notes: data.notes || "",
      images: data.images || null,
    }).returning()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
  }
}
