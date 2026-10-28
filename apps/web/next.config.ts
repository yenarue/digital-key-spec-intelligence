import type { NextConfig } from "next";
import path from "node:path";
const config: NextConfig = {
  distDir: process.env.DKSI_DEV === "1" ? ".next-dev" : ".next",
  transpilePackages: ["@dksi/spec-core"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  poweredByHeader: false,
  agentRules: false,
  async headers() { return [{ source: "/(.*)", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
  ] }]; },
};
export default config;
