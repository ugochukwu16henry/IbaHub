
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getUser();
  return Response.json(user);
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }
    // Check if user exists
    const existing = await db.select().from(users).where(users.email.eq(email));
    if (existing.length > 0) {
      return Response.json({ error: 'User already exists' }, { status: 409 });
    }
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    // Insert user
    const [created] = await db.insert(users).values({
      name,
      email,
      passwordHash,
    }).returning();
    return Response.json({ user: created });
  } catch (err) {
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
