import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy AI API calls server-side to avoid CORS
  async rewrites() {
    return [
      {
        source: "/api/ai/:path*",
        destination: `${process.env.AI_API_URL ?? "http://localhost:8000"}/:path*`,
      },
    ];
  },

  // Allow TradingView charting_library assets
  async headers() {
    return [
      {
        source: "/charting_library/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },

  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
