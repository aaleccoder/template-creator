import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for smaller runtime Docker image
  output: "standalone",
};

export default nextConfig;
