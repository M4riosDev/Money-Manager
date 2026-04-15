/** @type {import('next').NextConfig} */
const productionOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;

const allowedOrigins = ["localhost:3000"];

if (productionOrigin) {
  try {
    const normalizedOrigin = productionOrigin.startsWith("http")
      ? productionOrigin
      : `https://${productionOrigin}`;

    allowedOrigins.push(new URL(normalizedOrigin).host);
  } catch {
    allowedOrigins.push(productionOrigin);
  }
}

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

module.exports = nextConfig;
