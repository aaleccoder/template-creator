import type { NextConfig } from "next";




const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://back-pdf.srv812681.hstgr.cloud/**")]
  }
}
export default nextConfig;
