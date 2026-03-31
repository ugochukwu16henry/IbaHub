import Link from 'next/link';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function splitScopes(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[ ,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function denyRedirect(redirectUri: string | undefined, state: string | undefined) {
  if (!redirectUri) return null;
  try {
    const u = new URL(redirectUri);
    u.searchParams.set('error', 'access_denied');
    u.searchParams.set('error_description', 'User denied access');
    if (state) u.searchParams.set('state', state);
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Supabase OAuth Server consent path (Auth URL Configuration -> Authorization Path).
 * This page expects Supabase to provide at least one "continue" URL parameter for Approve.
 */
export default async function OAuthConsentPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const p = await searchParams;

  const clientId = one(p.client_id) ?? 'Unknown app';
  const clientName = one(p.client_name) ?? clientId;
  const redirectUri = one(p.redirect_uri);
  const state = one(p.state);
  const scopeRaw = one(p.scope);
  const scopes = splitScopes(scopeRaw);

  // Supabase may pass one of these for "continue OAuth flow".
  const approveUrl =
    one(p.redirect_to) ??
    one(p.next) ??
    one(p.continue) ??
    one(p.callback) ??
    null;
  const denyUrl = one(p.cancel) ?? denyRedirect(redirectUri, state);

  return (
    <main className="min-h-[100dvh] bg-gray-50 flex items-center justify-center px-4">
      <section className="w-full max-w-xl bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Authorize application</h1>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{clientName}</span> is requesting
          access to your IbaHub account.
        </p>

        <div className="mt-6 space-y-3 text-sm">
          <div>
            <p className="text-gray-500">Client ID</p>
            <p className="font-mono text-gray-900 break-all">{clientId}</p>
          </div>
          {redirectUri ? (
            <div>
              <p className="text-gray-500">Redirect URI</p>
              <p className="font-mono text-gray-900 break-all">{redirectUri}</p>
            </div>
          ) : null}
          <div>
            <p className="text-gray-500">Requested scopes</p>
            {scopes.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-2">
                {scopes.map((s) => (
                  <li
                    key={s}
                    className="text-xs rounded-full border border-gray-200 bg-gray-50 px-2 py-1"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">No explicit scopes provided.</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {approveUrl ? (
            <a
              href={approveUrl}
              className="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              Allow access
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-white cursor-not-allowed"
            >
              Allow access
            </button>
          )}

          {denyUrl ? (
            <a
              href={denyUrl}
              className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Deny
            </a>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          )}
        </div>

        {!approveUrl ? (
          <p className="mt-4 text-xs text-amber-700">
            Missing OAuth continuation parameter (expected one of:{' '}
            <code>redirect_to</code>, <code>next</code>, <code>continue</code>, <code>callback</code>).
          </p>
        ) : null}
      </section>
    </main>
  );
}

