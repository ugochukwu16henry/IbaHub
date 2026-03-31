import { NextResponse } from 'next/server';
import { fetchOidcDiscovery } from '@/lib/auth/sso/discovery';
import {
  getSsoRedirectUri,
  isSsoConfigured
} from '@/lib/auth/sso/config';
import {
  codeChallengeS256,
  generateCodeVerifier,
  randomState
} from '@/lib/auth/sso/pkce';

export const runtime = 'nodejs';

export async function GET() {
  if (!isSsoConfigured()) {
    return NextResponse.json({ error: 'SSO not configured' }, { status: 503 });
  }

  const issuer = process.env.AUTH_SSO_ISSUER!.trim();
  const clientId = process.env.AUTH_SSO_CLIENT_ID!.trim();
  const discovery = await fetchOidcDiscovery(issuer);
  const state = randomState();
  const nonce = randomState();
  const verifier = generateCodeVerifier();
  const challenge = codeChallengeS256(verifier);
  const redirectUri = getSsoRedirectUri();

  const url = new URL(discovery.authorization_endpoint);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set(
    'scope',
    process.env.AUTH_SSO_SCOPE?.trim() || 'openid email profile'
  );
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');

  const res = NextResponse.redirect(url.toString());
  const secure = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600
  };
  res.cookies.set('sso_state', state, base);
  res.cookies.set('sso_nonce', nonce, base);
  res.cookies.set('sso_verifier', verifier, base);
  return res;
}
