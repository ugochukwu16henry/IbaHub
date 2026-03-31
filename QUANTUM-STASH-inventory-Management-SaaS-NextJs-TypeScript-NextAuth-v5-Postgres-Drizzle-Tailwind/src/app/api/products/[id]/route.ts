import { NextResponse } from "next/server";

// Example in-memory store (replace with DB logic)
let products: any[] = [];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const idx = products.findIndex((p) => p.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = await req.json();
  products[idx] = { ...products[idx], ...data };
  return NextResponse.json(products[idx]);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const idx = products.findIndex((p) => p.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const deleted = products.splice(idx, 1)[0];
  return NextResponse.json(deleted);
}
