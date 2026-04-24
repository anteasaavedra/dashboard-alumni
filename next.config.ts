import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/dashboard-alumni',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
