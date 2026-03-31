import { NextResponse } from "next/server";

// Example in-memory store (replace with DB logic)
let transactions: any[] = [];

export async function POST(req: Request) {
  const data = await req.json();
  const { items, payment } = data;
  if (!items || !Array.isArray(items) || !payment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const newTransaction = {
    id: Date.now().toString(),
    items,
    payment,
    createdAt: new Date().toISOString(),
  };
  transactions.push(newTransaction);
  return NextResponse.json(newTransaction, { status: 201 });
}
