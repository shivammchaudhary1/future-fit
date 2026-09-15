import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@future-fit/config", "@future-fit/types"],
  async rewrites() {
    const upstream = process.env.API_UPSTREAM_URL ?? "http://localhost:8080";
    return [{ source: "/api/:path*", destination: `${upstream}/api/:path*` }];
  },
};

export default nextConfig;
