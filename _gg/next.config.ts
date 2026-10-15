import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql", "sharp", "web-push", "@capacitor/core", "@capacitor/app", "@capacitor/android", "@capacitor/splash-screen"],
  webpack: (config, { isServer }) => {
    // Exclude wizardduel game from server-side bundling — it's client-only
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'boardgame.io': 'boardgame.io',
        'bootstrap': 'bootstrap',
      });
    }
    return config;
  },
  allowedDevOrigins: [
    "preview-chat-65a97ec3-575b-4b4d-987f-8fa06df6cbf7.space.z.ai",
    "*.space.z.ai",
  ],
};

export default nextConfig;
