import { NextResponse } from "next/server"
import { db } from "@/db"
import { items } from "@/db/schema"
import { eq } from "drizzle-orm"

// GET: List all products
export async function GET() {
  try {
    const allItems = await db.select().from(items)
    return NextResponse.json(allItems)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST: Create a new product
export async function POST(req: Request) {
  try {
    const data = await req.json()
    // Basic validation (should match your itemSchema)
    if (!data.name || !data.category || !data.brand || !data.sellingPrice || !data.purchasePrice || !data.sku) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    // Insert into DB
    const [created] = await db.insert(items).values({
      name: data.name,
      category: data.category,
      brand: data.brand,
      barcode: data.barcode || "",
      description: data.description || "",
      sellingPrice: data.sellingPrice,
      purchasePrice: data.purchasePrice,
      taxRate: data.taxRate || 0,
      width: data.width || 0,
      height: data.height || 0,
      depth: data.depth || 0,
      dimensionsUnit: data.dimensionsUnit || "",
      weight: data.weight || 0,
      weightUnit: data.weightUnit || "",
      warehouse: data.warehouse || "",
      sku: data.sku,
      quantity: data.quantity || 0,
      unit: data.unit || "",
      reorderPoint: data.reorderPoint || 0,
      supplier: data.supplier || "",
      notes: data.notes || "",
      images: data.images || null,
    }).returning()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
