import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { NewUser } from '@/lib/db/schema';

const SALT_ROUNDS = 10;

function getAuthSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET must be set and at least 32 characters (e.g. openssl rand -base64 32).'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

type SessionData = {
  user: { id: number };
  expires: string;
};

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(getAuthSecretKey());
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, getAuthSecretKey(), {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

async function buildSessionCookieValue(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session: SessionData = {
    user: { id: user.id! },
    expires: expiresInOneDay.toISOString(),
  };
  const encryptedSession = await signToken(session);
  return { encryptedSession, expiresInOneDay };
}

export async function setSession(user: NewUser) {
  const { encryptedSession, expiresInOneDay } = await buildSessionCookieValue(user);
  (await cookies()).set('session', encryptedSession, {
    path: '/',
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

/** Use in Route Handlers when returning a redirect Response. */
export async function setSessionOnResponse(response: NextResponse, user: NewUser) {
  const { encryptedSession, expiresInOneDay } = await buildSessionCookieValue(user);
  response.cookies.set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
