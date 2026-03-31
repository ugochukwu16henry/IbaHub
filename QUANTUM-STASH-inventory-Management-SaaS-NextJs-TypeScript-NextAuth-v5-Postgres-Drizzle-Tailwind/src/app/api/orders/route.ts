import { NextResponse } from "next/server"
import { db } from "@/db"
import { orders } from "@/db/schema"

// GET: List all orders
export async function GET() {
  try {
    const all = await db.select().from(orders)
    return NextResponse.json(all)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST: Create a new order
export async function POST(req: Request) {
  try {
    const data = await req.json()
    if (!data.items || !Array.isArray(data.items) || !data.total) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const [created] = await db.insert(orders).values({
      items: data.items,
      total: data.total,
      status: data.status || "pending",
    }).returning()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
