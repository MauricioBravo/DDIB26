import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    // Turbopack picks its root by walking up for the nearest lockfile, and
    // anything outside that root is not resolved. On a machine with a stray
    // package-lock.json in the home directory, it silently selected that as
    // the root instead of this repo: the app still booted and "/" rendered,
    // but every nested route 404'd. Pinning the root to this directory makes
    // it independent of whatever happens to sit in the parent folders.
    root: __dirname,
  },
};

export default nextConfig;
