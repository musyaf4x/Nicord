import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Image optimization — allow Supabase storage domain
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },

  // Astryx uses StyleX — transpile the package
  transpilePackages: [
    "@astryxdesign/core",
    "@astryxdesign/theme-neutral",
  ],

  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      "@astryxdesign/core",
      "@tanstack/react-query",
    ],
  },
};

export default nextConfig;
