import type { NextConfig } from 'next';
import path from 'node:path';

/** §3.8 — pragmatic CSP for App Router + Paystack + optional OIDC SSO. */
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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
    [
      "connect-src 'self'",
      'https://api.paystack.co',
      'https://checkout.paystack.com',
      ...extraConnect
    ].join(' '),
    "frame-src https://js.paystack.co https://checkout.paystack.com"
  ];

  return base.join('; ');
}

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true
  },
  turbopack: {
    root: path.join(__dirname)
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
