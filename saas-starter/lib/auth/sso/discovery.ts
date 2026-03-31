import 'server-only';

export type OidcDiscoveryDocument = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
};

export async function fetchOidcDiscovery(
  issuerInput: string
): Promise<OidcDiscoveryDocument> {
  const base = issuerInput.endsWith('/') ? issuerInput : `${issuerInput}/`;
  const url = new URL('.well-known/openid-configuration', base);
  const res = await fetch(url.href, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`OIDC discovery failed: ${res.status}`);
  }
  return res.json() as Promise<OidcDiscoveryDocument>;
}
