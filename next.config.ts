import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module; keep it external so it isn't bundled.
  serverExternalPackages: ["better-sqlite3"],
  // Pin the workspace root to this project (a stray lockfile in $HOME otherwise
  // makes Next infer the wrong root).
  turbopack: { root: __dirname },
};

export default nextConfig;
