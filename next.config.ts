import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.14', 'localhost', '127.0.0.1'],
  experimental: {
    serverActions: {
      allowedOrigins: ['192.168.1.14:3000', 'localhost:3000', '127.0.0.1:3000'],
    },
  },
};

export default nextConfig;
