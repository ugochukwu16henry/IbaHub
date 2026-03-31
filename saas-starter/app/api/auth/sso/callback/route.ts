import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { fetchOidcDiscovery } from '@/lib/auth/sso/discovery';
import {
  getSsoProviderLabel,
  getSsoRedirectUri,
  isSsoConfigured
} from '@/lib/auth/sso/config';
import { completeOAuthAndRedirect } from '@/lib/auth/sso/provision';

export const runtime = 'nodejs';

function baseUrl() {
  return process.env.BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
}

export async function GET(request: NextRequest) {
  if (!isSsoConfigured()) {
    return NextResponse.redirect(new URL('/sign-in?error=sso_disabled', baseUrl()));
  }

  const { searchParams } = request.nextUrl;
  const err = searchParams.get('error');
  if (err) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(err)}`, baseUrl())
    );
  }

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieState = request.cookies.get('sso_state')?.value;
  const verifier = request.cookies.get('sso_verifier')?.value;

  if (!code || !state || !cookieState || state !== cookieState || !verifier) {
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_state', baseUrl())
    );
  }

  const issuer = process.env.AUTH_SSO_ISSUER!.trim();
  const clientId = process.env.AUTH_SSO_CLIENT_ID!.trim();
  const clientSecret = process.env.AUTH_SSO_CLIENT_SECRET!.trim();
  const redirectUri = getSsoRedirectUri();

  const discovery = await fetchOidcDiscovery(issuer);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: verifier
  });

  const tokenRes = await fetch(discovery.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!tokenRes.ok) {
    const t = await tokenRes.text();
    console.error('[sso] token exchange failed', tokenRes.status, t);
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_token', baseUrl())
    );
  }

  const tokens = (await tokenRes.json()) as { id_token?: string };
  const idToken = tokens.id_token;
  if (!idToken) {
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_no_id_token', baseUrl())
    );
  }

  const JWKS = createRemoteJWKSet(new URL(discovery.jwks_uri));
  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(idToken, JWKS, {
      issuer: discovery.issuer,
      audience: clientId
    });
    payload = verified.payload as Record<string, unknown>;
  } catch (e) {
    console.error('[sso] id_token verify failed', e);
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_jwt', baseUrl())
    );
  }

  const email = typeof payload.email === 'string' ? payload.email : undefined;
  if (!email) {
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_no_email', baseUrl())
    );
  }

  if (payload.email_verified === false) {
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_email_unverified', baseUrl())
    );
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
  if (!sub) {
    return NextResponse.redirect(
      new URL('/sign-in?error=oauth_no_sub', baseUrl())
    );
  }

  const name =
    typeof payload.name === 'string'
      ? payload.name
      : typeof payload.preferred_username === 'string'
        ? payload.preferred_username
        : null;

  const res = await completeOAuthAndRedirect({
    email,
    name,
    provider: getSsoProviderLabel(),
    sub
  });

  res.cookies.delete('sso_state');
  res.cookies.delete('sso_nonce');
  res.cookies.delete('sso_verifier');

  return res;
}
