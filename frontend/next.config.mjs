/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for the multi-stage Docker image — emits a minimal server bundle
  // at .next/standalone/server.js plus the static assets needed at runtime.
  output: "standalone",

  // Proxy /api/* to the backend so the browser always talks to the same origin.
  // This fixes cross-origin cookie scoping (refresh_token only sent to same origin)
  // and removes the CORS dependency for production.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
