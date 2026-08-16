import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: http://localhost:3001",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:3001",
      "frame-src 'self' blob:",
      "child-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

// Vercel uses its own output tracing — `standalone` breaks their NFT step
// (ENOENT next-server.js.nft.json). Keep standalone for Docker/VPS only.
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "standalone" as const }),
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/((?!api/files/).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
