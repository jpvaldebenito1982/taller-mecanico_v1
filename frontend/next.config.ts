import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path((?!auth).*)",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
