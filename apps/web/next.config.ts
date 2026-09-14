import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@future-fit/config", "@future-fit/types"],
};

export default nextConfig;
