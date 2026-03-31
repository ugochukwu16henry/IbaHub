import { NextResponse } from "next/server";

// Example in-memory store (replace with DB logic)
let inventory: any[] = [];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const item = inventory.find((i) => i.id === params.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const idx = inventory.findIndex((i) => i.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = await req.json();
  inventory[idx] = { ...inventory[idx], ...data };
  return NextResponse.json(inventory[idx]);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const idx = inventory.findIndex((i) => i.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = inventory.splice(idx, 1)[0];
  return NextResponse.json(deleted);
}
