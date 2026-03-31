import { NextResponse } from "next/server";

// Example in-memory store (replace with DB logic)
let inventory: any[] = [];

export async function GET() {
  return NextResponse.json(inventory);
}

export async function POST(req: Request) {
  const data = await req.json();
  const { productId, quantity, location } = data;
  if (!productId || quantity === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const newInventory = {
    id: Date.now().toString(),
    productId,
    quantity,
    location: location || "",
  };
  inventory.push(newInventory);
  return NextResponse.json(newInventory, { status: 201 });
}
