import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      // payment screenshots upload as FormData through a server action
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
