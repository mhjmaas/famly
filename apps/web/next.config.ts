import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "https",
        hostname: "**.example.com",
      },
    ],
  },
  webpack: (config) => {
    // Resolve @famly/shared path for Turbopack
    config.resolve.alias = {
      ...config.resolve.alias,
      "@famly/shared": path.resolve(__dirname, "../../packages/shared/src"),
    };
    return config;
  },
};

export default nextConfig;
