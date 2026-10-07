import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql", "sharp", "web-push"],
  allowedDevOrigins: [
    "preview-chat-65a97ec3-575b-4b4d-987f-8fa06df6cbf7.space.z.ai",
    "*.space.z.ai",
  ],
};

export default nextConfig;
