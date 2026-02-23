import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["app.pherce.com"],
    },
  },
};

export default nextConfig;
