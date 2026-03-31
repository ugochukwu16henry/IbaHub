import type { NextConfig } from 'next';

/** §3.8 — pragmatic CSP for App Router + Stripe.js + optional OIDC SSO. */
function buildContentSecurityPolicy() {
  const extraConnect =
    process.env.AUTH_SSO_CSP_ORIGINS?.split(',')
      .map((v) => v.trim())
      .filter(Boolean) ?? [];

  const base = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    [
      "connect-src 'self'",
      'https://api.stripe.com',
      'https://m.stripe.network',
      'https://*.stripe.com',
      ...extraConnect
    ].join(' '),
    "frame-src https://js.stripe.com https://hooks.stripe.com"
  ];

  return base.join('; ');
}

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true
  },
  /** INTEGRATION_PLAN §3.8 — baseline security headers */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)'
          },
          { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() }
        ]
      }
    ];
  }
};

export default nextConfig;
