import type { NextConfig } from "next";

const pocketbase_url = process.env.POCKETBASE_URL || 'http://localhost:8090';

console.log(pocketbase_url);


const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: pocketbase_url,
        pathname: '/api/files/**',
      }
    ]
  }
};

export default nextConfig;
