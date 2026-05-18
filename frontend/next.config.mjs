/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for the multi-stage Docker image — emits a minimal server bundle
  // at .next/standalone/server.js plus the static assets needed at runtime.
  output: "standalone",
};

export default nextConfig;
