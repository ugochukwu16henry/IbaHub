import 'server-only';

export function isSsoConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SSO_ISSUER?.trim() &&
      process.env.AUTH_SSO_CLIENT_ID?.trim() &&
      process.env.AUTH_SSO_CLIENT_SECRET?.trim()
  );
}

export function getSsoRedirectUri(): string {
  const base =
    process.env.BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  return `${base}/api/auth/sso/callback`;
}

/** Stored on users.oauth_provider (e.g. oidc, google). */
export function getSsoProviderLabel(): string {
  return process.env.AUTH_SSO_PROVIDER_NAME?.trim() || 'oidc';
}
