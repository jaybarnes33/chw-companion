import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nyaaba/content", "@nyaaba/rules-engine", "@nyaaba/db"],
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
