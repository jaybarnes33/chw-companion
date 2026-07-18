import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@chw/content", "@chw/rules-engine", "@chw/db"],
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
