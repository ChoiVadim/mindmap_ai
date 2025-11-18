import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Required for BlockNote with React 19 / Next 15
  allowedDevOrigins: [
    "172.30.1.97",
  ],
};

export default nextConfig;
