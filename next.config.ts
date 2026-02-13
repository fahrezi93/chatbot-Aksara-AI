import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['pdf-parse'],
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://chatbot-gemini-bccf8.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
