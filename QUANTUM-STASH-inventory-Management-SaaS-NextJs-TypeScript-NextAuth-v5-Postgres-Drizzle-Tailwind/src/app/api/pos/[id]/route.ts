import { NextRequest, NextResponse } from "next/server"
import { db, eq } from "@/db"
import { pos } from "@/db/schema"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await db.select().from(pos).where(eq(pos.id, Number(params.id)))
  if (!result.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(result[0])
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const updated = await db.update(pos).set(body).where(eq(pos.id, Number(params.id))).returning()
  if (!updated.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(updated[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const deleted = await db.delete(pos).where(eq(pos.id, Number(params.id))).returning()
  if (!deleted.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
