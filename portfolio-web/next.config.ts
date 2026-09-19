import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/portfolio",
  assetPrefix: "/portfolio",
  skipTrailingSlashRedirect: true,
  trailingSlash: false,
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 12,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
