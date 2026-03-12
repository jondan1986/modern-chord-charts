import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  allowedDevOrigins: ['*.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev'],
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:9000',
        '127.0.0.1:9002',
        '*.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev',
      ],
    },
  },
};

export default nextConfig;
