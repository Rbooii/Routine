import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server actions (enabled by default in Next.js 15)
  experimental: {
    // Needed for Auth.js edge compatibility
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
