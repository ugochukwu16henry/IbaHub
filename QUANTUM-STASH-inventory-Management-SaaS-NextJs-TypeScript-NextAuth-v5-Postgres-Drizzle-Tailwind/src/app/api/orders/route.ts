import { NextResponse } from "next/server";

// Example in-memory store (replace with DB logic)
let orders: any[] = [];

export async function GET() {
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const data = await req.json();
  const { items, total, status } = data;
  if (!items || !Array.isArray(items) || !total) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const newOrder = {
    id: Date.now().toString(),
    items,
    total,
    status: status || "pending",
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  return NextResponse.json(newOrder, { status: 201 });
}
