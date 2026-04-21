/** @type {import('next').NextConfig} */
const productionOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;

const allowedOrigins = ["localhost:3000"];
if (productionOrigin) {
  try {
    const normalized = productionOrigin.startsWith("http")
      ? productionOrigin
      : `https://${productionOrigin}`;
    allowedOrigins.push(new URL(normalized).host);
  } catch {
    allowedOrigins.push(productionOrigin);
  }
}

// ── Content-Security-Policy ───────────────────────────────────────────────────
// Adjust script-src / connect-src if you add third-party scripts or APIs.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "";

const cspParts = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for its inline style injection in dev;
  // in production you can tighten this with a nonce or hash if needed.
  "style-src 'self' 'unsafe-inline'",
  // No external scripts — remove 'unsafe-eval' once you verify no eval usage.
  "script-src 'self' 'unsafe-inline'",
  // Allow fetch to Supabase only
  supabaseHost
    ? `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`
    : "connect-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Upgrade HTTP → HTTPS automatically
  "upgrade-insecure-requests",
];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspParts.join("; "),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // 1 year HSTS, include subdomains, preload-ready
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
];

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
