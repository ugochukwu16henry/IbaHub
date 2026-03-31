import { NextResponse } from "next/server";

// Example in-memory store (replace with DB logic)
let orders: any[] = [];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const order = orders.find((o) => o.id === params.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const idx = orders.findIndex((o) => o.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = await req.json();
  orders[idx] = { ...orders[idx], ...data };
  return NextResponse.json(orders[idx]);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const idx = orders.findIndex((o) => o.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = orders.splice(idx, 1)[0];
  return NextResponse.json(deleted);
}
