import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/facksten",
  assetPrefix: "/facksten",
  skipTrailingSlashRedirect: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 12,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
