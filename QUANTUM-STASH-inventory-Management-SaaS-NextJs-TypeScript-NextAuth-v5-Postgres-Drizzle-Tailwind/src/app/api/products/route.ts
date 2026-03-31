import { NextResponse } from "next/server";

// Example in-memory store (replace with DB logic)
let products: any[] = [];

export async function GET() {
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const data = await req.json();
  const { name, description, price, stock } = data;
  if (!name || !price || stock === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const newProduct = {
    id: Date.now().toString(),
    name,
    description: description || "",
    price,
    stock,
  };
  products.push(newProduct);
  return NextResponse.json(newProduct, { status: 201 });
}
